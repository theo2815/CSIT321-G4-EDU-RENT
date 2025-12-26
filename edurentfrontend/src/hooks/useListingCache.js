import { useContext } from 'react';
import { ListingCacheContext } from '../context/ContextDefinitions';

export function useListingCache() {
  return useContext(ListingCacheContext);
}
