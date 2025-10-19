// src/supabase/limits.js

const FREE_TIER_LIMIT = 20;

export async function checkUserLimit(supabase, userId) {
    // 1. Looking for a user
    let { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id_hash', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw new Error(`Supabase query error: ${error.message}`);
    }

    const today = new Date();
    
    // 2. If the user is not found
    if (!user) {
        console.log("New user, creating record:", userId);
        const nextResetDate = new Date();
        nextResetDate.setDate(today.getDate() + 30);

        const { error: insertError } = await supabase
            .from('users')
            .insert({ user_id_hash: userId, check_count: 1, reset_date: nextResetDate.toISOString() });
        
        if (insertError) throw new Error(`Supabase insert error: ${insertError.message}`);
        return { allowed: true };
    }

    // 3. If the user is found
    const resetDate = new Date(user.reset_date);
    if (today > resetDate) {
        console.log("Resetting count for user:", userId);
        const nextResetDate = new Date();
        nextResetDate.setDate(today.getDate() + 30);
        const { error: updateError } = await supabase
            .from('users')
            .update({ check_count: 1, reset_date: nextResetDate.toISOString() })
            .eq('user_id_hash', userId);
        if (updateError) throw new Error(`Supabase update error: ${updateError.message}`);
        return { allowed: true };
    }

    if (user.check_count >= FREE_TIER_LIMIT) {
        console.log("Limit reached for user:", userId);
        return { allowed: false, message: "Monthly limit reached. Please upgrade to Premium." };
    }
    
    const { error: updateError } = await supabase
        .from('users')
        .update({ check_count: user.check_count + 1 })
        .eq('user_id_hash', userId);
    if (updateError) throw new Error(`Supabase update error: ${updateError.message}`);

    return { allowed: true };
}