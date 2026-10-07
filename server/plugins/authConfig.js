import { getAuthSecret } from '../utils/authConfig.js'
export default defineNitroPlugin(() => { getAuthSecret() })
