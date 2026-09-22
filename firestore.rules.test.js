// Firestore Security Rules regression tests.
//
// Covers the "★ Firestore 규칙 회귀" scenario from VERIFICATION.md (P1-c):
// publish/private read access on `specs/{specId}`, create/update/delete
// ownership checks, and the unrelated `config/{uid}` privacy guarantee.
//
// Run with: npm run test:rules
// (requires the Firebase Firestore emulator, which requires a JDK — see README/CLAUDE.md)

import { after, before, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing'

const OWNER_UID = 'owner-uid'
const OTHER_UID = 'other-uid'
const ADMIN_UID = 'admin-uid'

let testEnv

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'settle-up-rules-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  })
})

after(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
})

// Seed documents directly, bypassing security rules (admin-equivalent access).
async function seed(setup) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setup(context.firestore())
  })
}

describe('specs/{specId} read access', () => {
  it('denies an unauthenticated read of a private spec (published missing)', async () => {
    await seed((db) => db.collection('specs').doc('private-no-flag').set({ uid: OWNER_UID, title: 'x' }))
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(db.collection('specs').doc('private-no-flag').get())
  })

  it('denies an unauthenticated read of a private spec (published: false)', async () => {
    await seed((db) => db.collection('specs').doc('private-false').set({ uid: OWNER_UID, published: false }))
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(db.collection('specs').doc('private-false').get())
  })

  it('allows an unauthenticated read of a published spec', async () => {
    await seed((db) => db.collection('specs').doc('published-1').set({ uid: OWNER_UID, published: true }))
    const db = testEnv.unauthenticatedContext().firestore()
    await assertSucceeds(db.collection('specs').doc('published-1').get())
  })
})

describe('specs/{specId} write access on a published spec', () => {
  beforeEach(() =>
    seed((db) => db.collection('specs').doc('published-2').set({ uid: OWNER_UID, published: true })),
  )

  it('denies update by an unauthenticated user', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(db.collection('specs').doc('published-2').update({ title: 'hacked' }))
  })

  it('denies update by a different uid', async () => {
    const db = testEnv.authenticatedContext(OTHER_UID).firestore()
    await assertFails(db.collection('specs').doc('published-2').update({ title: 'hacked' }))
  })

  it('denies delete by an unauthenticated user', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(db.collection('specs').doc('published-2').delete())
  })

  it('denies delete by a different uid', async () => {
    const db = testEnv.authenticatedContext(OTHER_UID).firestore()
    await assertFails(db.collection('specs').doc('published-2').delete())
  })
})

describe('specs/{specId} owner access (unaffected by published)', () => {
  it('lets the owner read/update/delete their own private spec', async () => {
    await seed((db) => db.collection('specs').doc('owner-private').set({ uid: OWNER_UID, published: false }))
    const db = testEnv.authenticatedContext(OWNER_UID).firestore()
    const ref = db.collection('specs').doc('owner-private')
    await assertSucceeds(ref.get())
    await assertSucceeds(ref.update({ title: 'edited by owner' }))
    await assertSucceeds(ref.delete())
  })

  it('lets the owner read/update/delete their own published spec', async () => {
    await seed((db) => db.collection('specs').doc('owner-published').set({ uid: OWNER_UID, published: true }))
    const db = testEnv.authenticatedContext(OWNER_UID).firestore()
    const ref = db.collection('specs').doc('owner-published')
    await assertSucceeds(ref.get())
    await assertSucceeds(ref.update({ title: 'edited by owner' }))
    await assertSucceeds(ref.delete())
  })

  it('lets the owner create a spec with their own uid, and denies creating one under another uid', async () => {
    const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
    await assertSucceeds(ownerDb.collection('specs').doc('new-by-owner').set({ uid: OWNER_UID, published: false }))
    await assertFails(ownerDb.collection('specs').doc('new-spoofed').set({ uid: OTHER_UID, published: false }))
  })
})

describe('config/{uid} stays fully private, untouched by the publish rules', () => {
  it('denies a non-owner read of someone else\'s config, even for the owner of a published spec', async () => {
    await seed(async (db) => {
      await db.collection('specs').doc('published-3').set({ uid: OWNER_UID, published: true })
      await db.collection('config').doc(OTHER_UID).set({ templates: [] })
    })
    // OWNER_UID owns a published spec, but that grants no access to OTHER_UID's config.
    const db = testEnv.authenticatedContext(OWNER_UID).firestore()
    await assertFails(db.collection('config').doc(OTHER_UID).get())
  })

  it('denies an unauthenticated read of any config', async () => {
    await seed((db) => db.collection('config').doc(OWNER_UID).set({ templates: [] }))
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(db.collection('config').doc(OWNER_UID).get())
  })

  it('denies a non-owner write of someone else\'s config', async () => {
    await seed((db) => db.collection('config').doc(OWNER_UID).set({ templates: [] }))
    const db = testEnv.authenticatedContext(OTHER_UID).firestore()
    await assertFails(db.collection('config').doc(OWNER_UID).set({ templates: ['hacked'] }))
  })

  it('allows the owner to read/write their own config', async () => {
    await seed((db) => db.collection('config').doc(OWNER_UID).set({ templates: [] }))
    const db = testEnv.authenticatedContext(OWNER_UID).firestore()
    await assertSucceeds(db.collection('config').doc(OWNER_UID).get())
    await assertSucceeds(db.collection('config').doc(OWNER_UID).set({ templates: ['ok'] }))
  })
})

describe('events/{eventId} append-only log rules', () => {
  it('lets the owner create an event with their own uid', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore()
    await assertSucceeds(
      db.collection('events').doc('event-1').set({ uid: OWNER_UID, name: 'spec_created', properties: {} }),
    )
  })

  it('denies creating an event with a mismatched uid', async () => {
    const db = testEnv.authenticatedContext(OWNER_UID).firestore()
    await assertFails(
      db.collection('events').doc('event-spoofed').set({ uid: OTHER_UID, name: 'spec_created', properties: {} }),
    )
  })

  it('lets the owner read their own event', async () => {
    await seed((db) => db.collection('events').doc('event-2').set({ uid: OWNER_UID, name: 'spec_created', properties: {} }))
    const db = testEnv.authenticatedContext(OWNER_UID).firestore()
    await assertSucceeds(db.collection('events').doc('event-2').get())
  })

  it('denies another uid from reading someone else\'s event', async () => {
    await seed((db) => db.collection('events').doc('event-3').set({ uid: OWNER_UID, name: 'spec_created', properties: {} }))
    const db = testEnv.authenticatedContext(OTHER_UID).firestore()
    await assertFails(db.collection('events').doc('event-3').get())
  })

  it('denies update and delete even for the owner', async () => {
    await seed((db) => db.collection('events').doc('event-4').set({ uid: OWNER_UID, name: 'spec_created', properties: {} }))
    const db = testEnv.authenticatedContext(OWNER_UID).firestore()
    await assertFails(db.collection('events').doc('event-4').update({ name: 'hacked' }))
    await assertFails(db.collection('events').doc('event-4').delete())
  })
})

describe('admins/{uid} read-only, no client write path', () => {
  it('allows an admin (has an admins/{uid} doc) to read another user\'s event', async () => {
    await seed(async (db) => {
      await db.collection('admins').doc(ADMIN_UID).set({})
      await db.collection('events').doc('event-admin-1').set({ uid: OWNER_UID, name: 'spec_created', properties: {} })
    })
    const db = testEnv.authenticatedContext(ADMIN_UID).firestore()
    await assertSucceeds(db.collection('events').doc('event-admin-1').get())
  })

  it('allows an admin (has an admins/{uid} doc) to read another user\'s private spec', async () => {
    await seed(async (db) => {
      await db.collection('admins').doc(ADMIN_UID).set({})
      await db.collection('specs').doc('spec-admin-1').set({ uid: OWNER_UID, published: false })
    })
    const db = testEnv.authenticatedContext(ADMIN_UID).firestore()
    await assertSucceeds(db.collection('specs').doc('spec-admin-1').get())
  })

  it('denies a non-admin (no admins/{uid} doc) from reading another user\'s event via the isAdmin() path', async () => {
    await seed((db) => db.collection('events').doc('event-nonadmin-1').set({ uid: OWNER_UID, name: 'spec_created', properties: {} }))
    const db = testEnv.authenticatedContext(OTHER_UID).firestore()
    await assertFails(db.collection('events').doc('event-nonadmin-1').get())
  })

  it('denies a non-admin (no admins/{uid} doc) from reading another user\'s private spec via the isAdmin() path', async () => {
    await seed((db) => db.collection('specs').doc('spec-nonadmin-1').set({ uid: OWNER_UID, published: false }))
    const db = testEnv.authenticatedContext(OTHER_UID).firestore()
    await assertFails(db.collection('specs').doc('spec-nonadmin-1').get())
  })

  it('CRITICAL: denies an admin from creating/updating/deleting their own admins/{uid} doc', async () => {
    await seed((db) => db.collection('admins').doc(ADMIN_UID).set({}))
    const db = testEnv.authenticatedContext(ADMIN_UID).firestore()
    await assertFails(db.collection('admins').doc(ADMIN_UID).set({ note: 'self-promote' }))
    await assertFails(db.collection('admins').doc(ADMIN_UID).update({ note: 'still nope' }))
    await assertFails(db.collection('admins').doc(ADMIN_UID).delete())
  })

  it('CRITICAL: denies any user from creating/updating/deleting someone else\'s admins/{uid} doc', async () => {
    await seed((db) => db.collection('admins').doc(ADMIN_UID).set({}))
    const db = testEnv.authenticatedContext(OTHER_UID).firestore()
    await assertFails(db.collection('admins').doc(OTHER_UID).set({}))
    await assertFails(db.collection('admins').doc(ADMIN_UID).update({ note: 'hacked' }))
    await assertFails(db.collection('admins').doc(ADMIN_UID).delete())
  })

  it('lets a user read their own admins/{uid} doc but not someone else\'s', async () => {
    await seed((db) => db.collection('admins').doc(ADMIN_UID).set({}))
    const db = testEnv.authenticatedContext(ADMIN_UID).firestore()
    await assertSucceeds(db.collection('admins').doc(ADMIN_UID).get())
    await assertFails(db.collection('admins').doc(OTHER_UID).get())
  })

  it('denies an unauthenticated read of any admins/{uid} doc', async () => {
    await seed((db) => db.collection('admins').doc(ADMIN_UID).set({}))
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(db.collection('admins').doc(ADMIN_UID).get())
  })
})

describe('projects/{projectId} owner-only rules (no published concept)', () => {
  it('lets the owner create a project with their own uid, and denies creating one under another uid', async () => {
    const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore()
    await assertSucceeds(ownerDb.collection('projects').doc('new-by-owner').set({ uid: OWNER_UID, name: 'my project' }))
    await assertFails(ownerDb.collection('projects').doc('new-spoofed').set({ uid: OTHER_UID, name: 'spoofed' }))
  })

  it('lets the owner read/update/delete their own project', async () => {
    await seed((db) => db.collection('projects').doc('owner-project').set({ uid: OWNER_UID, name: 'original' }))
    const db = testEnv.authenticatedContext(OWNER_UID).firestore()
    const ref = db.collection('projects').doc('owner-project')
    await assertSucceeds(ref.get())
    await assertSucceeds(ref.update({ name: 'renamed by owner' }))
    await assertSucceeds(ref.delete())
  })

  it('denies another uid from reading, updating, or deleting someone else\'s project', async () => {
    await seed((db) => db.collection('projects').doc('other-project').set({ uid: OWNER_UID, name: 'private project' }))
    const db = testEnv.authenticatedContext(OTHER_UID).firestore()
    const ref = db.collection('projects').doc('other-project')
    await assertFails(ref.get())
    await assertFails(ref.update({ name: 'hacked' }))
    await assertFails(ref.delete())
  })

  it('denies an unauthenticated user from reading or writing any project', async () => {
    await seed((db) => db.collection('projects').doc('unauth-project').set({ uid: OWNER_UID, name: 'private project' }))
    const db = testEnv.unauthenticatedContext().firestore()
    const ref = db.collection('projects').doc('unauth-project')
    await assertFails(ref.get())
    await assertFails(ref.update({ name: 'hacked' }))
    await assertFails(ref.delete())
    await assertFails(db.collection('projects').doc('unauth-new').set({ uid: OWNER_UID, name: 'x' }))
  })
})

// Sanity check so a silently-empty test file (e.g. emulator not reachable) doesn't pass as green.
describe('sanity', () => {
  it('ran the expected number of top-level describe blocks', () => {
    assert.ok(testEnv, 'testEnv should have been initialized in before()')
  })
})
