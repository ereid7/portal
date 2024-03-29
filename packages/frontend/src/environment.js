import pkg from '../package.json'

const ENV_VARS = {
  BACKEND_URL() {
    return process.env.REACT_APP_BACKEND_URL ?? ''
  },
  BUILD() {
    return pkg.gitHead ?? 'undefined'
  },
  ENABLE_A11Y() {
    return process.env.REACT_APP_ENABLE_A11Y === 'true' ?? false
  },
  GODMODE_ACCOUNTS() {
    return process.env.REACT_APP_GODMODE_ACCOUNTS?.trim().split(',') ?? []
  },
  HASURA_SECRET() {
    return process.env.REACT_APP_HASURA_ADMIN_SECRET?.trim() ?? ''
  },
  HASURA_URL() {
    return process.env.REACT_APP_HASURA_URL ?? ''
  },
  PROD() {
    return process.env.NODE_ENV === 'production'
  },
  USE_TEST_APP() {
    return process.env.REACT_APP_USE_TEST_APP === 'true' ?? false
  },
  TEST_APP_PUB_KEY() {
    return process.env.REACT_APP_TEST_APP_PUB_KEY?.trim() ?? ''
  },
  SENTRY_DSN() {
    return process.env.REACT_APP_SENTRY_DSN?.trim() ?? ''
  },
}

export default function env(name) {
  return ENV_VARS[name]()
}
