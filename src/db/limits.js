// src/db/limits.js

const MESSAGES = {
  PREMIUM_LIMIT_REACHED: 'Daily limit reached (3/3). Limit resets in 24h.', // // also need to change in designPanel.js
};

const FREE_TIER_LIMIT = 3;

/**
 * STEP 1: Access Guard (Read-only)
 * Checks if the user is allowed to perform the request.
 */
export async function checkUserAccess(supabase, userId) {
  // Find user by ID
  let { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id_hash', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Supabase query error: ${error.message}`);
  }

  // New user
  if (!user) return { allowed: true, isNewUser: true };

  // Existing user
  const today = new Date();
  const resetDate = new Date(user.reset_date);

  if (today > resetDate) {
    // Limit period expired — reset required
    return { allowed: true, needsReset: true, user: user };
  }

  if (user.check_count >= FREE_TIER_LIMIT) {
    // Limit exceeded
    return { allowed: false, message: MESSAGES.PREMIUM_LIMIT_REACHED };
  }

  // Within limit
  return { allowed: true, user: user };
}

/**
 * STEP 2: Usage Recorder (Write-only)
 * Records successful service usage.
 */
export async function recordUserUsage(supabase, userId, limitCheckData) {
  const today = new Date();

  // Same time tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // New user
  if (limitCheckData.isNewUser) {
    await supabase.from('users').insert({
      user_id_hash: userId,
      check_count: 1,
      reset_date: tomorrow.toISOString(),
    });
    return;
  }

  // Set deadline for tomorrow
  if (limitCheckData.needsReset) {
    await supabase
      .from('users')
      .update({ check_count: 1, reset_date: tomorrow.toISOString() })
      .eq('user_id_hash', userId);
    return;
  }

  // Increment usage counter
  if (limitCheckData.user) {
    await supabase
      .from('users')
      .update({ check_count: limitCheckData.user.check_count + 1 })
      .eq('user_id_hash', userId);
  }
}

export async function getUserUsage(supabase, userId) {
  let { data: user, error } = await supabase
    .from('users')
    .select('check_count, reset_date')
    .eq('user_id_hash', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Supabase query error: ${error.message}`);
  }

  if (!user) {
    return { used: 0, limit: FREE_TIER_LIMIT };
  }

  const today = new Date();
  const resetDate = new Date(user.reset_date);

  if (today > resetDate) {
    return { used: 0, limit: FREE_TIER_LIMIT };
  } else {
    return { used: user.check_count, limit: FREE_TIER_LIMIT };
  }
}
