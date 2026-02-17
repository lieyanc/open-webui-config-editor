export interface ModelCapabilities {
  vision?: boolean;
  file_upload?: boolean;
  file_context?: boolean;
  web_search?: boolean;
  image_generation?: boolean;
  code_interpreter?: boolean;
  citations?: boolean;
  status_updates?: boolean;
  usage?: boolean;
  builtin_tools?: boolean;
}

export interface BuiltinTools {
  time?: boolean;
  memory?: boolean;
  chats?: boolean;
  notes?: boolean;
  knowledge?: boolean;
  channels?: boolean;
  web_search?: boolean;
  image_generation?: boolean;
  code_interpreter?: boolean;
}

export interface ModelTag {
  name: string;
}

export interface ModelMeta {
  profile_image_url?: string;
  description?: string | null;
  capabilities?: ModelCapabilities;
  builtinTools?: BuiltinTools;
  suggestion_prompts?: string[] | null;
  tags?: ModelTag[];
}

export interface AccessControl {
  read: {
    group_ids: string[];
    user_ids: string[];
  };
  write: {
    group_ids: string[];
    user_ids: string[];
  };
}

export interface ModelParams {
  system?: string;
  temperature?: number;
  reasoning_effort?: string;
}

export interface OpenAIInfo {
  id: string;
  name?: string;
  owned_by?: string;
  openai?: { id: string };
  urlIdx?: number;
  connection_type?: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  owned_by: string;
  openai: OpenAIInfo;
  urlIdx: number;
  connection_type: string;
  user_id: string;
  base_model_id: string | null;
  params: ModelParams;
  meta: ModelMeta;
  access_control: AccessControl | null;
  is_active: boolean;
  updated_at: number;
  created_at: number;
}
