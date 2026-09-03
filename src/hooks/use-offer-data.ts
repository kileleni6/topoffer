import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchMyTargets,
  fetchMyVotes,
  fetchOffers,
  readVisitorKey,
  toggleVote,
} from "@/lib/offers";

/** Anonymous visitor id from localStorage. Empty string until hydrated. */
export function useVisitorKey() {
  const [key, setKey] = useState("");
  useEffect(() => {
    setKey(readVisitorKey());
  }, []);
  return key;
}

export function useOffers() {
  return useQuery({
    queryKey: ["offers"], queryFn: fetchOffers, staleTime: 5 * 60_000,
    gcTime: 30 * 60_000, refetchOnWindowFocus: false,
  });
}

export function useMyVotes(voterKey: string) {
  return useQuery({
    queryKey: ["votes", voterKey],
    queryFn: () => fetchMyVotes(voterKey),
    enabled: voterKey !== "",
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useMyTargets(ownerKey: string) {
  return useQuery({
    queryKey: ["targets", ownerKey],
    queryFn: () => fetchMyTargets(ownerKey),
    enabled: ownerKey !== "",
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useToggleVote(voterKey: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => toggleVote(offerId, voterKey),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["offers"] });
      void qc.invalidateQueries({ queryKey: ["votes", voterKey] });
    },
  });
}
