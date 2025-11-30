import { supabase } from './supabaseClient';
import { CarnivalEvent, TicketTier, Ticket } from '../types';

export const ticketsService = {
    // --- Events ---

    async getEvents(category: string = 'All') {
        let query = supabase
            .from('events')
            .select(`
                *,
                tiers:ticket_tiers(*)
            `)
            .eq('status', 'published')
            .order('date', { ascending: true });

        if (category !== 'All') {
            query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as CarnivalEvent[];
    },

    async getEventById(id: string) {
        const { data, error } = await supabase
            .from('events')
            .select(`
                *,
                tiers:ticket_tiers(*)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as CarnivalEvent;
    },

    async createEvent(event: Partial<CarnivalEvent>, tiers: Partial<TicketTier>[]) {
        // 1. Create Event
        const { data: eventData, error: eventError } = await supabase
            .from('events')
            .insert(event)
            .select()
            .single();

        if (eventError) throw eventError;

        // 2. Create Tiers
        const tiersWithEventId = tiers.map(t => ({
            ...t,
            event_id: eventData.id
        }));

        const { error: tiersError } = await supabase
            .from('ticket_tiers')
            .insert(tiersWithEventId);

        if (tiersError) throw tiersError;

        return eventData;
    },

    // --- Tickets / Purchasing ---

    async purchaseTickets(eventId: string, tierId: string, quantity: number, holderName: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User must be logged in');

        // Note: In a real app, we'd use a transaction or RPC to ensure stock isn't oversold.
        // For this demo, we'll just check and insert.

        // 1. Check Stock
        const { data: tier, error: tierError } = await supabase
            .from('ticket_tiers')
            .select('*')
            .eq('id', tierId)
            .single();

        if (tierError) throw tierError;
        if (tier.quantity_sold + quantity > tier.quantity_total) {
            throw new Error('Not enough tickets available');
        }

        // 2. Create Tickets
        const ticketsToCreate = Array.from({ length: quantity }).map(() => ({
            event_id: eventId,
            tier_id: tierId,
            user_id: user.id,
            holder_name: holderName,
            holder_email: user.email,
            qr_code_hash: `TICKET-${Math.random().toString(36).substring(7).toUpperCase()}-${Date.now()}`,
            status: 'valid'
        }));

        const { data: tickets, error: ticketError } = await supabase
            .from('tickets')
            .insert(ticketsToCreate)
            .select();

        if (ticketError) throw ticketError;

        // 3. Update Sold Count
        await supabase
            .from('ticket_tiers')
            .update({ quantity_sold: tier.quantity_sold + quantity })
            .eq('id', tierId);

        return tickets;
    },

    async getMyTickets() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('tickets')
            .select(`
                *,
                event:events(title, date, time, location, image_url),
                tier:ticket_tiers(name, price, perks)
            `)
            .eq('user_id', user.id)
            .order('purchase_date', { ascending: false });

        if (error) throw error;
        return data as Ticket[];
    },

    // --- Promoter / Scanner ---

    async getMyEvents() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('events')
            .select(`
                *,
                tiers:ticket_tiers(*)
            `)
            .eq('organizer_id', user.id);

        if (error) throw error;
        return data as CarnivalEvent[];
    },

    async scanTicket(qrCode: string, eventId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Scanner not authenticated');

        // 1. Find Ticket
        const { data: ticket, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('qr_code_hash', qrCode)
            .eq('event_id', eventId)
            .single();

        if (error || !ticket) return { status: 'invalid', message: 'Ticket not found' };

        // 2. Check Status
        if (ticket.status === 'used') {
            return { status: 'duplicate', message: `Already scanned at ${new Date(ticket.scanned_at).toLocaleTimeString()}`, ticket };
        }
        if (ticket.status !== 'valid') {
            return { status: 'invalid', message: `Ticket is ${ticket.status}`, ticket };
        }

        // 3. Mark as Used
        const { data: updatedTicket, error: updateError } = await supabase
            .from('tickets')
            .update({
                status: 'used',
                scanned_at: new Date().toISOString(),
                scanned_by: user.id
            })
            .eq('id', ticket.id)
            .select()
            .single();

        if (updateError) throw updateError;

        return { status: 'valid', message: 'Access Granted', ticket: updatedTicket };
    }
};
