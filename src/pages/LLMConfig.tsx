import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { llmApi } from "../services/api";
import {
  ChevronLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon,
  ServerStackIcon,
  ArrowsUpDownIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";

interface ApiKey {
  key_id: string;
  vendor_name: string;
  key_env_name: string;
  model?: string;
  base_url?: string;
  auth_type: string;
  description?: string;
  is_enabled: boolean;
  has_api_key_value: boolean;
  api_key_value_masked?: string;
}

interface Scenario {
  scenario_name: string;
  description?: string;
  temperature: number;
  max_tokens: number;
  timeout_seconds: number;
  is_enabled: boolean;
}

interface ScenarioKey {
  key_id: string;
  vendor_name: string;
  key_env_name: string;
  model?: string;
  base_url?: string;
  auth_type: string;
  description?: string;
  priority: number;
  is_enabled: boolean;
}

interface ValidationResult {
  valid: boolean;
  message: string;
  model?: string | null;
  latency_ms?: number | null;
}

interface Vendor {
  vendor_name: string;
  protocol: string;
  base_url?: string;
  default_model?: string;
  available_models: string[];
  is_enabled: boolean;
}

type TabType = "api-keys" | "scenarios" | "scenario-keys";

export default function LLMConfig() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("api-keys");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>("");
  const [scenarioKeys, setScenarioKeys] = useState<ScenarioKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [saving, setSaving] = useState(false);
  const [validatingKeyId, setValidatingKeyId] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<
    Record<string, ValidationResult>
  >({});
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form states
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [keyForm, setKeyForm] = useState({
    key_id: "",
    vendor_name: "",
    key_env_name: "",
    api_key_value: "",
    model: "",
    base_url: "",
    auth_type: "bearer",
    description: "",
    is_enabled: true,
  });

  const [showAddScenarioKeyModal, setShowAddScenarioKeyModal] = useState(false);
  const [addScenarioKeyForm, setAddScenarioKeyForm] = useState({
    key_id: "",
    priority: 1,
  });

  // Scenario edit states
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [scenarioForm, setScenarioForm] = useState({
    description: "",
    temperature: 0.7,
    max_tokens: 2000,
    timeout_seconds: 60,
    is_enabled: true,
  });

  useEffect(() => {
    if (activeTab === "api-keys") {
      loadApiKeys();
    } else if (activeTab === "scenarios") {
      loadScenarios();
    } else if (activeTab === "scenario-keys") {
      if (scenarios.length === 0) {
        // 场景列表未加载，先加载（loadScenarios 内部会设置 selectedScenario）
        loadScenarios();
      } else if (selectedScenario) {
        // 场景已选中，直接加载 keys
        loadScenarioKeys(selectedScenario);
      } else if (scenarios.length > 0) {
        // 有场景但未选中，选中第一个（触发下方 useEffect 加载 keys）
        setSelectedScenario(scenarios[0].scenario_name);
      }
    }
  }, [activeTab]);

  // 选中场景变化时加载 keys
  useEffect(() => {
    if (activeTab === "scenario-keys" && selectedScenario) {
      loadScenarioKeys(selectedScenario);
    }
  }, [selectedScenario]);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const [keysResponse, vendorsResponse] = await Promise.all([
        llmApi.getApiKeys(),
        llmApi.getVendors(),
      ]);
      setApiKeys(keysResponse.data.items || []);
      setVendors(vendorsResponse.data.items || []);
    } catch (error) {
      console.error("加载 API Keys 失败:", error);
      setMessage({ type: "error", text: "加载 API Keys 失败" });
    } finally {
      setLoading(false);
    }
  };

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const response = await llmApi.getScenarios();
      setScenarios(response.data.items || []);
      if (response.data.items?.length > 0 && !selectedScenario) {
        setSelectedScenario(response.data.items[0].scenario_name);
      }
    } catch (error) {
      console.error("加载场景配置失败:", error);
      setMessage({ type: "error", text: "加载场景配置失败" });
    } finally {
      setLoading(false);
    }
  };

  const loadScenarioKeys = async (scenarioName: string) => {
    try {
      setLoading(true);
      const response = await llmApi.getScenarioKeys(scenarioName);
      const items = (response.data.items || []) as ScenarioKey[];
      items.sort((a, b) => a.priority - b.priority);
      setScenarioKeys(items);
    } catch (error) {
      console.error("加载场景 Keys 失败:", error);
      setMessage({ type: "error", text: "加载场景 Keys 失败" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const data = {
        key_id: keyForm.key_id,
        vendor_name: keyForm.vendor_name,
        key_env_name: keyForm.key_env_name,
        api_key_value: keyForm.api_key_value || undefined,
        model: keyForm.model || undefined,
        base_url: keyForm.base_url || undefined,
        auth_type: keyForm.auth_type,
        description: keyForm.description || undefined,
        is_enabled: keyForm.is_enabled,
      };

      if (editingKey) {
        await llmApi.updateApiKey(editingKey.key_id, data);
        setMessage({ type: "success", text: "更新成功" });
      } else {
        await llmApi.createApiKey(data);
        setMessage({ type: "success", text: "创建成功" });
      }

      setShowKeyModal(false);
      setEditingKey(null);
      resetKeyForm();
      loadApiKeys();
    } catch (error) {
      console.error("保存失败:", error);
      setMessage({ type: "error", text: "保存失败" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm(`确定要删除 API Key "${keyId}" 吗？`)) return;

    try {
      setSaving(true);
      await llmApi.deleteApiKey(keyId);
      setMessage({ type: "success", text: "删除成功" });
      loadApiKeys();
    } catch (error) {
      console.error("删除失败:", error);
      setMessage({ type: "error", text: "删除失败" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleKey = async (keyId: string) => {
    try {
      setSaving(true);
      await llmApi.toggleApiKey(keyId);
      loadApiKeys();
    } catch (error) {
      console.error("切换状态失败:", error);
      setMessage({ type: "error", text: "切换状态失败" });
    } finally {
      setSaving(false);
    }
  };

  const handleValidateKey = async (keyId: string) => {
    try {
      setValidatingKeyId(keyId);
      // 清除该 key 之前的验证结果
      setValidationResults((prev) => {
        const next = { ...prev };
        delete next[keyId];
        return next;
      });

      const response = await llmApi.validateApiKey(keyId);
      const result = response.data as ValidationResult;
      setValidationResults((prev) => ({ ...prev, [keyId]: result }));

      if (result.valid) {
        setMessage({
          type: "success",
          text: `Key "${keyId}" 验证通过 (${result.model}, ${result.latency_ms}ms)`,
        });
      } else {
        setMessage({ type: "error", text: `Key "${keyId}": ${result.message}` });
      }
    } catch (error) {
      console.error("验证失败:", error);
      setMessage({ type: "error", text: `Key "${keyId}" 验证请求失败` });
    } finally {
      setValidatingKeyId(null);
    }
  };

  const handleAddScenarioKey = async () => {
    if (!selectedScenario) return;

    try {
      setSaving(true);
      await llmApi.addScenarioKey(selectedScenario, {
        key_id: addScenarioKeyForm.key_id,
        priority: addScenarioKeyForm.priority,
      });
      setMessage({ type: "success", text: "添加成功" });
      setShowAddScenarioKeyModal(false);
      setAddScenarioKeyForm({ key_id: "", priority: 1 });
      loadScenarioKeys(selectedScenario);
    } catch (error) {
      console.error("添加失败:", error);
      setMessage({ type: "error", text: "添加失败" });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveScenarioKey = async (keyId: string) => {
    if (!selectedScenario) return;
    if (!confirm(`确定要从场景中移除 Key "${keyId}" 吗？`)) return;

    try {
      setSaving(true);
      await llmApi.removeScenarioKey(selectedScenario, keyId);
      setMessage({ type: "success", text: "移除成功" });
      loadScenarioKeys(selectedScenario);
    } catch (error) {
      console.error("移除失败:", error);
      setMessage({ type: "error", text: "移除失败" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePriority = async (keyId: string, newPriority: number) => {
    if (!selectedScenario) return;

    try {
      setSaving(true);
      await llmApi.updateScenarioKeyPriority(selectedScenario, keyId, newPriority);
      setMessage({ type: "success", text: "优先级更新成功" });
      await loadScenarioKeys(selectedScenario);
    } catch (error) {
      console.error("更新优先级失败:", error);
      setMessage({ type: "error", text: "更新优先级失败" });
    } finally {
      setSaving(false);
    }
  };

  const resetKeyForm = () => {
    setKeyForm({
      key_id: "",
      vendor_name: "",
      key_env_name: "",
      api_key_value: "",
      model: "",
      base_url: "",
      auth_type: "bearer",
      description: "",
      is_enabled: true,
    });
  };

  const openEditKeyModal = (key: ApiKey) => {
    setEditingKey(key);
    setKeyForm({
      key_id: key.key_id,
      vendor_name: key.vendor_name,
      key_env_name: key.key_env_name,
      api_key_value: "",
      model: key.model || "",
      base_url: key.base_url || "",
      auth_type: key.auth_type || "bearer",
      description: key.description || "",
      is_enabled: key.is_enabled,
    });
    setShowKeyModal(true);
  };

  const openNewKeyModal = () => {
    setEditingKey(null);
    resetKeyForm();
    setShowKeyModal(true);
  };

  const openEditScenarioModal = (scenario: Scenario) => {
    setEditingScenario(scenario);
    setScenarioForm({
      description: scenario.description || "",
      temperature: scenario.temperature,
      max_tokens: scenario.max_tokens,
      timeout_seconds: scenario.timeout_seconds,
      is_enabled: scenario.is_enabled,
    });
    setShowScenarioModal(true);
  };

  const handleUpdateScenario = async () => {
    if (!editingScenario) return;

    try {
      setSaving(true);
      setMessage(null);

      await llmApi.updateScenario(editingScenario.scenario_name, scenarioForm);
      setMessage({ type: "success", text: "更新成功" });

      setShowScenarioModal(false);
      setEditingScenario(null);
      loadScenarios();
    } catch (error) {
      console.error("更新场景失败:", error);
      setMessage({ type: "error", text: "更新场景失败" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleScenario = async (scenarioName: string, currentEnabled: boolean) => {
    try {
      setSaving(true);
      await llmApi.updateScenario(scenarioName, { is_enabled: !currentEnabled });
      setMessage({ type: "success", text: "状态切换成功" });
      loadScenarios();
    } catch (error) {
      console.error("切换状态失败:", error);
      setMessage({ type: "error", text: "切换状态失败" });
    } finally {
      setSaving(false);
    }
  };

  const availableKeysForScenario = apiKeys.filter(
    (key) => !scenarioKeys.find((sk) => sk.key_id === key.key_id)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate("/")}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                  LLM 配置管理
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                  管理 LLM API Keys 和场景配置
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("api-keys")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "api-keys"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <KeyIcon className="w-4 h-4 inline-block mr-1" />
              API Keys
            </button>
            <button
              onClick={() => setActiveTab("scenarios")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "scenarios"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ServerStackIcon className="w-4 h-4 inline-block mr-1" />
              场景配置
            </button>
            <button
              onClick={() => setActiveTab("scenario-keys")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "scenario-keys"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ArrowsUpDownIcon className="w-4 h-4 inline-block mr-1" />
              场景 Key 池
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Alert Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              <ExclamationCircleIcon className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === "api-keys" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">API Keys</h2>
              <button
                onClick={openNewKeyModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                添加 API Key
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Key ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      供应商
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      模型
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Base URL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      API Key
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      认证方式
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      验证
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {apiKeys.map((key) => (
                    <tr key={key.key_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {key.key_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {key.vendor_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {key.model || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {key.base_url || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {key.has_api_key_value ? (
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {key.api_key_value_masked}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">使用环境变量</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            key.auth_type === "bearer"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {key.auth_type === "bearer" ? "Bearer" : "Query Param"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleKey(key.key_id)}
                          disabled={saving}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            key.is_enabled
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {key.is_enabled ? "启用" : "禁用"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {validatingKeyId === key.key_id ? (
                          <span className="text-gray-400 text-xs">验证中...</span>
                        ) : validationResults[key.key_id] ? (
                          validationResults[key.key_id].valid ? (
                            <span className="text-green-600 text-xs">
                              {validationResults[key.key_id].model} ({validationResults[key.key_id].latency_ms}ms)
                            </span>
                          ) : (
                            <span className="text-red-500 text-xs truncate max-w-[200px] block" title={validationResults[key.key_id].message}>
                              {validationResults[key.key_id].message}
                            </span>
                          )
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleValidateKey(key.key_id)}
                          disabled={validatingKeyId === key.key_id}
                          className="p-1 text-gray-400 hover:text-amber-600 mr-2"
                          title="验证 API Key"
                        >
                          {validatingKeyId === key.key_id ? (
                            <svg
                              className="w-4 h-4 animate-spin"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                          ) : (
                            <BoltIcon className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditKeyModal(key)}
                          className="p-1 text-gray-400 hover:text-gray-600 mr-2"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteKey(key.key_id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {apiKeys.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        暂无 API Keys，点击上方按钮添加
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Scenarios Tab */}
        {activeTab === "scenarios" && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">场景配置</h2>
            <div className="grid gap-4">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.scenario_name}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {scenario.scenario_name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {scenario.description || "无描述"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600">
                        <div>temperature: {scenario.temperature}</div>
                        <div>max_tokens: {scenario.max_tokens}</div>
                        <div>timeout: {scenario.timeout_seconds}s</div>
                      </div>
                      <button
                        onClick={() => handleToggleScenario(scenario.scenario_name, scenario.is_enabled)}
                        disabled={saving}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          scenario.is_enabled
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {scenario.is_enabled ? "启用" : "禁用"}
                      </button>
                      <button
                        onClick={() => openEditScenarioModal(scenario)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="编辑"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {scenarios.length === 0 && !loading && (
                <div className="text-center text-gray-500 py-8">
                  暂无场景配置
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scenario Keys Tab */}
        {activeTab === "scenario-keys" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-medium text-gray-900">场景 Key 池</h2>
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {scenarios.map((s) => (
                    <option key={s.scenario_name} value={s.scenario_name}>
                      {s.scenario_name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowAddScenarioKeyModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={!selectedScenario || availableKeysForScenario.length === 0}
              >
                <PlusIcon className="w-4 h-4" />
                添加 Key
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      优先级
                      <span className="ml-1 normal-case font-normal text-gray-400">(数字越小越优先)</span>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Key ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      供应商
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      模型
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      认证方式
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      状态
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {scenarioKeys.map((key) => (
                    <tr key={key.key_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        <input
                          type="number"
                          min={1}
                          defaultValue={key.priority}
                          key={`${key.key_id}-${key.priority}`}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val !== key.priority) {
                              handleUpdatePriority(key.key_id, val);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {key.key_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {key.vendor_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {key.model || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            key.auth_type === "bearer"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {key.auth_type === "bearer" ? "Bearer" : "Query Param"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            key.is_enabled
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {key.is_enabled ? "启用" : "禁用"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemoveScenarioKey(key.key_id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {scenarioKeys.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        暂无关联的 Keys，点击上方按钮添加
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">
                {editingKey ? "编辑 API Key" : "添加 API Key"}
              </h3>
              <button
                onClick={() => {
                  setShowKeyModal(false);
                  setEditingKey(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key ID *
                </label>
                <input
                  type="text"
                  value={keyForm.key_id}
                  onChange={(e) =>
                    setKeyForm({ ...keyForm, key_id: e.target.value })
                  }
                  placeholder="例如: juguang-img-1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!!editingKey}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  供应商名称 *
                </label>
                <select
                  value={keyForm.vendor_name}
                  onChange={(e) => {
                    const vendorName = e.target.value;
                    const vendor = vendors.find((v) => v.vendor_name === vendorName);
                    setKeyForm({
                      ...keyForm,
                      vendor_name: vendorName,
                      base_url: vendor?.base_url || "",
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择供应商</option>
                  {vendors.map((v) => (
                    <option key={v.vendor_name} value={v.vendor_name}>
                      {v.vendor_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  环境变量名 *
                </label>
                <input
                  type="text"
                  value={keyForm.key_env_name}
                  onChange={(e) =>
                    setKeyForm({ ...keyForm, key_env_name: e.target.value })
                  }
                  placeholder="例如: JUGUANG_API_KEY_1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  需要在服务器环境变量中配置此变量
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API 密钥值
                </label>
                <input
                  type="password"
                  autoComplete="off"
                  value={keyForm.api_key_value}
                  onChange={(e) =>
                    setKeyForm({ ...keyForm, api_key_value: e.target.value })
                  }
                  placeholder={
                    editingKey?.has_api_key_value
                      ? `当前: ${editingKey.api_key_value_masked}（留空保留原值）`
                      : "可选，直接输入密钥值（如 sk-xxx）"
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editingKey
                    ? "留空保留原值，填入新值则更新。优先级高于环境变量"
                    : "可选。填入后优先使用此密钥，为空则使用环境变量"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  模型
                </label>
                <input
                  type="text"
                  list="model-options"
                  value={keyForm.model}
                  onChange={(e) =>
                    setKeyForm({ ...keyForm, model: e.target.value })
                  }
                  placeholder="选择或输入模型名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <datalist id="model-options">
                  {vendors
                    .find((v) => v.vendor_name === keyForm.vendor_name)
                    ?.available_models.map((m) => (
                      <option key={m} value={m} />
                    ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base URL
                </label>
                <input
                  type="text"
                  value={keyForm.base_url}
                  onChange={(e) =>
                    setKeyForm({ ...keyForm, base_url: e.target.value })
                  }
                  placeholder="例如: https://ai.juguang.chat/v1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  认证方式
                </label>
                <select
                  value={keyForm.auth_type}
                  onChange={(e) =>
                    setKeyForm({ ...keyForm, auth_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bearer">Bearer Token (Header)</option>
                  <option value="query_param">Query Parameter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <input
                  type="text"
                  value={keyForm.description}
                  onChange={(e) =>
                    setKeyForm({ ...keyForm, description: e.target.value })
                  }
                  placeholder="可选描述"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_enabled"
                  checked={keyForm.is_enabled}
                  onChange={(e) =>
                    setKeyForm({ ...keyForm, is_enabled: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_enabled" className="text-sm text-gray-700">
                  启用
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => {
                  setShowKeyModal(false);
                  setEditingKey(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveKey}
                disabled={
                  saving ||
                  !keyForm.key_id ||
                  !keyForm.vendor_name ||
                  !keyForm.key_env_name
                }
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Scenario Key Modal */}
      {showAddScenarioKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">添加 Key 到场景</h3>
              <button
                onClick={() => setShowAddScenarioKeyModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择 API Key *
                </label>
                <select
                  value={addScenarioKeyForm.key_id}
                  onChange={(e) =>
                    setAddScenarioKeyForm({
                      ...addScenarioKeyForm,
                      key_id: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择</option>
                  {availableKeysForScenario.map((key) => (
                    <option key={key.key_id} value={key.key_id}>
                      {key.key_id} ({key.vendor_name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  优先级
                </label>
                <input
                  type="number"
                  min={1}
                  value={addScenarioKeyForm.priority}
                  onChange={(e) =>
                    setAddScenarioKeyForm({
                      ...addScenarioKeyForm,
                      priority: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  数字越小优先级越高
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowAddScenarioKeyModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddScenarioKey}
                disabled={saving || !addScenarioKeyForm.key_id}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? "添加中..." : "添加"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Edit Modal */}
      {showScenarioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">
                编辑场景 - {editingScenario?.scenario_name}
              </h3>
              <button
                onClick={() => {
                  setShowScenarioModal(false);
                  setEditingScenario(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <input
                  type="text"
                  value={scenarioForm.description}
                  onChange={(e) =>
                    setScenarioForm({ ...scenarioForm, description: e.target.value })
                  }
                  placeholder="场景描述"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={scenarioForm.temperature}
                  onChange={(e) =>
                    setScenarioForm({
                      ...scenarioForm,
                      temperature: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">控制随机性，0-2 之间</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Tokens
                </label>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={scenarioForm.max_tokens}
                  onChange={(e) =>
                    setScenarioForm({
                      ...scenarioForm,
                      max_tokens: parseInt(e.target.value) || 2000,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">最大生成 token 数</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeout (秒)
                </label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={scenarioForm.timeout_seconds}
                  onChange={(e) =>
                    setScenarioForm({
                      ...scenarioForm,
                      timeout_seconds: parseInt(e.target.value) || 60,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">请求超时时间，10-300 秒</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="scenario_is_enabled"
                  checked={scenarioForm.is_enabled}
                  onChange={(e) =>
                    setScenarioForm({ ...scenarioForm, is_enabled: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="scenario_is_enabled" className="text-sm text-gray-700">
                  启用
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={() => {
                  setShowScenarioModal(false);
                  setEditingScenario(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdateScenario}
                disabled={saving}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
