const assert = require('assert')

const make_rosmaro_redlock = require('./rosmaro-redlock')

const make_redlock_mock = () => {

  let ttls = {}

  let waiting_locks = {}

  let waiting_failed_locks = {}

  let waiting_unlocks = {}

  let waiting_failed_unlocks = {}

  const make_lock = resource => ({
    unlock(cb) {
      waiting_unlocks[resource] = () => cb()
      waiting_failed_unlocks[resource] = err => cb(err)
    }
  })

  const redlock = {

    ttls,

    finish_locking(resource) {
      if (waiting_locks[resource]) waiting_locks[resource]()
    },

    fail_locking(resource, err) {
      if (waiting_failed_locks[resource]) waiting_failed_locks[resource](err)
    },

    finish_unlocking(resource) {
      if (waiting_unlocks[resource]) waiting_unlocks[resource]()
    },

    fail_unlocking(resource, err) {
      if (waiting_failed_unlocks[resource]) waiting_failed_unlocks[resource](err)
    },

    lock(resource, ttl, cb) {
      ttls[resource] = ttl
      waiting_locks[resource] = () => cb(null, make_lock(resource))
      waiting_failed_locks[resource] = err => cb(err)
    }

  }

  return redlock
}

describe("rosmaro-redlock", function () {

  const resource = "abc"
  const ttl = 123
  let redlock, lock

  beforeEach(function () {
    redlock = make_redlock_mock()
    lock = make_rosmaro_redlock({redlock, resource, ttl})
  })

  it("provides the interface Rosmaro understands", async function () {

    let unlock
    let error_when_acquiring

    const acquiring_lock = lock()
      .then(fn => unlock = fn)
      .catch(err => error_when_acquiring = err)

    assert(!unlock)
    assert(!error_when_acquiring)

    redlock.finish_locking(resource)
    await acquiring_lock

    assert(unlock)
    assert(redlock.ttls[resource] === ttl)
    assert(!error_when_acquiring)

    let unlocked
    let error_when_releasing

    const unlocking = unlock()
      .then(() => unlocked = true)
      .catch(err => error_when_releasing = err)

    assert(!unlocked)
    assert(!error_when_releasing)

    redlock.finish_unlocking(resource)
    await unlocking

    assert(unlocked)
    assert(!error_when_releasing)

  })

  describe("being transparent to errors", function () {

    it("throws the original error if locking fails", async function() {
      let unlock
      let error_when_acquiring

      const acquiring_lock = lock()
        .then(fn => unlock = fn)
        .catch(err => error_when_acquiring = err)

      const locking_error = new Error('reason')
      redlock.fail_locking(resource, locking_error)
      await acquiring_lock

      assert(!unlock)
      assert(error_when_acquiring === locking_error)
    })

    it("throws the original error if unlocking fails", async function() {
      const locking_process = lock()
      redlock.finish_locking(resource)
      const unlock = await locking_process

      let unlocked
      let error_when_releasing

      const unlocking = unlock()
        .then(() => unlocked = true)
        .catch(err => error_when_releasing = err)

      const unlocking_error = new Error('reason')
      redlock.fail_unlocking(resource, unlocking_error)
      await unlocking
      return

      assert(!unlocked)
      assert(error_when_releasing === unlocking_error)
    })

  })

})
