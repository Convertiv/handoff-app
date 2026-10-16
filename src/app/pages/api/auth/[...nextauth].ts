import NextAuth from 'next-auth';
import { registryAuthOptions } from '../../../lib/auth/config';

export default NextAuth(registryAuthOptions);
