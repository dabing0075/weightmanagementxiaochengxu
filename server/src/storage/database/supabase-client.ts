import { createClient } from '@supabase/supabase-js';

// Supabase 配置 - Coze 平台自动注入的环境变量
const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 环境变量缺失，请在 Coze 平台开通 Supabase 服务');
  console.error('需要的环境变量: COZE_SUPABASE_URL, COZE_SUPABASE_ANON_KEY 或 COZE_SUPABASE_SERVICE_ROLE_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
