import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useLiveInventory(onUpdate: (payload: any) => void) {
    useEffect(() => {
        const channel = supabase
            .channel('public:products')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'products',
                },
                (payload) => {
                    console.log('Real-time update received:', payload);
                    onUpdate(payload.new);
                }
            )
            .subscribe((status) => {
                console.log('Real-time subscription status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [onUpdate]);
}
