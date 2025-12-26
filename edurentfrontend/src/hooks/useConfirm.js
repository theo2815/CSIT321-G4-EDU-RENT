import { useContext } from 'react';
import { ConfirmationContext } from '../context/ContextDefinitions';

export const useConfirm = () => useContext(ConfirmationContext);
