// src/db/pendingOps.js
export async function createPendingOp(supabase, userId) {
  const { data, error } = await supabase
    .from('pending_ops')
    .insert({ user_id: userId })
    .select('op_id')
    .single();

  if (error) throw new Error(`DB pending insert error: ${error.message}`);
  return data.op_id;
}

// atomic "confirmation": delete the pending record and write off the limit
export async function consumePendingOp(supabase, userId, opId, limitSnapshot, recordUserUsage) {
  const { data, error } = await supabase
    .from('pending_ops')
    .delete()
    .eq('op_id', opId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(`Pending op not found/expired: ${error.message}`);

  await recordUserUsage(supabase, userId, limitSnapshot);
}
