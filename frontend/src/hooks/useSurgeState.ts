import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabaseClient";

export function useSurgeState() {
    const [isSurgeActive, setIsSurgeActive] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Initial Fetch
        const fetchSurgeState = async () => {
            try {
                const { data, error } = await supabase
                    .from("store_settings")
                    .select("value")
                    .eq("key", "is_surge_active")
                    .single();

                if (error) {
                    console.error("Error fetching surge state:", error);
                } else if (data) {
                    setIsSurgeActive(!!data.value);
                }
            } catch (err) {
                console.error("Surge state fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSurgeState();

        // 2. Realtime Subscription
        const channel = supabase
            .channel("store_settings_changes")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "store_settings",
                    filter: "key=eq.is_surge_active",
                },
                (payload) => {
                    if (payload.new && typeof payload.new.value === "boolean") {
                        setIsSurgeActive(payload.new.value);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { isSurgeActive, loading };
}
