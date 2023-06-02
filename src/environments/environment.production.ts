import { Environment } from '@trusona/webauthn'

export const environment = {
  production: true,
  sdkId: process.env['SDK_ID'],
  sdkEnvironment: Environment.PRODUCTION
}
