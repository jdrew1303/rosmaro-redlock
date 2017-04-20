module.exports = opts => {
  const {redlock, resource, ttl} = opts

  const make_unlock_fn = lock => () => new Promise((resolve, reject) => {
    const resolve_if_ok = err => err
      ? reject(err)
      : resolve()
    lock.unlock(resolve_if_ok)
  })

  const lock = () => new Promise((resolve, reject) => {
    const unlock_fn_if_ok = (err, lock) => err
      ? reject(err)
      : resolve(make_unlock_fn(lock))
    redlock.lock(resource, ttl, unlock_fn_if_ok)
  })

  return lock
}
