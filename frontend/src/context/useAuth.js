import { useContext } from 'react';
import { AuthContext } from './Context';

export const useAuth = () => useContext(AuthContext);
