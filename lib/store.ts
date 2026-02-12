import { create } from 'zustand'

interface AppState {
  campaignTotal: number
  setCampaignTotal: (amount: number) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  campaignTotal: 0,
  setCampaignTotal: (amount) => set({ campaignTotal: amount }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}))
