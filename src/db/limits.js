// src/db/limits.js

const MESSAGES = {
  PREMIUM_LIMIT_REACHED: 'Limit reached. Premium coming soon.', // also need to change in designPanel.js
};

const FREE_TIER_LIMIT = 20;

/**
 * STEP 1: Access Guard (Read-only)
 * Checks if the user is allowed to perform the request.
 */
export async function checkUserAccess(supabase, userId) {
  console.log('6. SERVER: limits.js -> checkUserAccess');

  // Find user by ID
  let { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id_hash', userId)
    .single();

  console.log('7. SERVER: limits.js -> after finding user by ID');

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Supabase query error: ${error.message}`);
  }

  // User not found — first request
  if (!user) {
    return { allowed: true, isNewUser: true };
  }

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

  console.log(
    '8. SERVER: limits.js -> before return, check_count=',
    user.check_count,
  );

  // Within limit
  return { allowed: true, user: user };
}

/**
 * STEP 2: Usage Recorder (Write-only)
 * Records successful service usage.
 */
export async function recordUserUsage(supabase, userId, limitCheckData) {
  console.log('SERVER: limits.js -> recordUserUsage');
  const today = new Date();

  // New user
  if (limitCheckData.isNewUser) {
    const nextResetDate = new Date();
    nextResetDate.setDate(today.getDate() + 30);

    await supabase
      .from('users')
      .insert({
        user_id_hash: userId,
        check_count: 1,
        reset_date: nextResetDate.toISOString(),
      });
    return;
  }

  // Reset required
  if (limitCheckData.needsReset) {
    const nextResetDate = new Date();
    nextResetDate.setDate(today.getDate() + 30);

    await supabase
      .from('users')
      .update({ check_count: 1, reset_date: nextResetDate.toISOString() })
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
    const nextResetDate = new Date();
    nextResetDate.setDate(today.getDate() + 30);

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        user_id_hash: userId,
        check_count: 1,
        reset_date: nextResetDate.toISOString(),
      });

    if (insertError)
      throw new Error(`Supabase insert error: ${insertError.message}`);
    return { allowed: true };
  }

  // 3. If the user is found
  const resetDate = new Date(user.reset_date);
  if (today > resetDate) {
    const nextResetDate = new Date();
    nextResetDate.setDate(today.getDate() + 30);
    const { error: updateError } = await supabase
      .from('users')
      .update({ check_count: 1, reset_date: nextResetDate.toISOString() })
      .eq('user_id_hash', userId);
    if (updateError)
      throw new Error(`Supabase update error: ${updateError.message}`);
    return { allowed: true };
  }

  if (user.check_count >= FREE_TIER_LIMIT) {
    return { allowed: false, message: MESSAGES.PREMIUM_LIMIT_REACHED };
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ check_count: user.check_count + 1 })
    .eq('user_id_hash', userId);
  if (updateError)
    throw new Error(`Supabase update error: ${updateError.message}`);

  return { allowed: true };
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
