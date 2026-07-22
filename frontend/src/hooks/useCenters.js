import { useQuery } from '@tanstack/react-query'
import * as centersApi from '../api/centers'

export function useCenters() {
  return useQuery({
    queryKey: ['centers'],
    queryFn: () => centersApi.getCenters().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })
}
