import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputText, Card, TabView, Textarea } from '@/components/ui';
import { getCurrentTenant, getCurrentProduct } from '../../stores/authStore';
import { settings } from '../../services/api';
import {
  Twitter, Globe, MessageCircle, Image, Check, AlertCircle, Save, Package,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function SettingsPage() {
  const tenant = getCurrentTenant();
  const product = getCurrentProduct();
  const productId = sessionStorage.getItem('currentProductId');
  const navigate = useNavigate();

  const [currentSettings, setCurrentSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [toast, setToast] = useState<{severity: string; summary: string; detail: string} | null>(null);

  // X/Twitter
  const [xApiKey, setXApiKey] = useState('');
  const [xApiSecret, setXApiSecret] = useState('');
  const [xAccessToken, setXAccessToken] = useState('');
  const [xAccessSecret, setXAccessSecret] = useState('');
  const [savingSocial, setSavingSocial] = useState(false);

  // Google Ads
  const [googleAdsDeveloperToken, setGoogleAdsDeveloperToken] = useState('');
  const [googleAdsClientId, setGoogleAdsClientId] = useState('');
  const [googleAdsClientSecret, setGoogleAdsClientSecret] = useState('');
  const [savingGoogleAds, setSavingGoogleAds] = useState(false);

  // WhatsApp
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState('');
  const [whatsappToken, setWhatsappToken] = useState('');
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  // Brand
  const [logoUrl, setLogoUrl] = useState('');
  const [assets, setAssets] = useState<any[]>([]);
  const [savingBrand, setSavingBrand] = useState(false);

  // Product Context
  const [productDescription, setProductDescription] = useState('');
  const [productTarget, setProductTarget] = useState('');
  const [productFeatures, setProductFeatures] = useState('');
  const [productCompetitors, setProductCompetitors] = useState('');
  const [productWebsite, setProductWebsite] = useState('');
  const [savingProductContext, setSavingProductContext] = useState(false);

  const productName = product?.name || 'MarketingOS';

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchSettings = () => {
    if (!tenant || !productId) return;
    setLoading(true);
    settings
      .get(tenant.id, productId)
      .then((r) => {
        const data = r.data || {};
        setCurrentSettings(data);
        setXApiKey(data.xApiKey || '');
        setXApiSecret(data.xApiSecret || '');
        setXAccessToken(data.xAccessToken || '');
        setXAccessSecret(data.xAccessSecret || '');
        setGoogleAdsDeveloperToken(data.googleAdsDeveloperToken || '');
        setGoogleAdsClientId(data.googleAdsClientId || '');
        setGoogleAdsClientSecret(data.googleAdsClientSecret || '');
        setWhatsappPhoneNumberId(data.whatsappPhoneNumberId || '');
        setWhatsappToken(data.whatsappToken || '');
        setLogoUrl(data.logoUrl || '');
      })
      .catch(() => {
        setToast({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las configuraciones' });
      })
      .finally(() => setLoading(false));
  };

  const loadProductInfo = () => {
    if (!tenant || !productId) return;
    fetch(`/api/webhooks/products-debug?tenantId=${tenant.id}`)
      .then(r => r.json())
      .then(data => {
        const p = data.products?.find((p: any) => p.id === productId);
        if (p) {
          setProductDescription(p.description || '');
          const ctx = p.brandContext || {};
          setProductTarget(ctx.targetMarket || '');
          setProductFeatures(ctx.features?.join('\n') || '');
          setProductCompetitors(ctx.competitors?.join('\n') || '');
          setProductWebsite(ctx.website || '');
        }
      })
      .catch(() => {});
  };

  const handleSaveProductContext = async () => {
    if (!productId) return;
    setSavingProductContext(true);
    try {
      const brandContext = {
        targetMarket: productTarget,
        features: productFeatures.split('\n').filter(Boolean),
        competitors: productCompetitors.split('\n').filter(Boolean),
        website: productWebsite,
      };
      const res = await fetch('/api/webhooks/products-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, description: productDescription, brandContext }),
      });
      const data = await res.json();
      if (data.updated) {
        setToast({ severity: 'success', summary: 'Guardado', detail: 'Contexto del producto actualizado' });
      } else {
        setToast({ severity: 'error', summary: 'Error', detail: data.error || 'No se pudo guardar' });
      }
    } catch {
      setToast({ severity: 'error', summary: 'Error', detail: 'Error de conexión' });
    } finally {
      setSavingProductContext(false);
    }
  };

  const fetchAssets = () => {
    if (!tenant || !productId) return;
    settings.getUploads(tenant.id, productId)
      .then((r) => setAssets(r.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchSettings();
    fetchAssets();
    loadProductInfo();
  }, [tenant?.id, productId]);

  const handleSaveSocial = async () => {
    if (!tenant || !productId) return;
    setSavingSocial(true);
    try {
      await settings.update(tenant.id, productId, { xApiKey, xApiSecret, xAccessToken, xAccessSecret });
      setToast({ severity: 'success', summary: 'Guardado', detail: 'Redes sociales guardadas' });
      fetchSettings();
    } catch {
      setToast({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
    } finally {
      setSavingSocial(false);
    }
  };

  const handleSaveGoogleAds = async () => {
    if (!tenant || !productId) return;
    setSavingGoogleAds(true);
    try {
      await settings.update(tenant.id, productId, { googleAdsDeveloperToken, googleAdsClientId, googleAdsClientSecret });
      setToast({ severity: 'success', summary: 'Guardado', detail: 'Google Ads guardado' });
      fetchSettings();
    } catch {
      setToast({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
    } finally {
      setSavingGoogleAds(false);
    }
  };

  const handleSaveWhatsapp = async () => {
    if (!tenant || !productId) return;
    setSavingWhatsapp(true);
    try {
      await settings.update(tenant.id, productId, { whatsappPhoneNumberId, whatsappToken });
      setToast({ severity: 'success', summary: 'Guardado', detail: 'WhatsApp guardado' });
      fetchSettings();
    } catch {
      setToast({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const handleSaveBrand = async () => {
    if (!tenant || !productId) return;
    setSavingBrand(true);
    try {
      await settings.update(tenant.id, productId, { logoUrl });
      setToast({ severity: 'success', summary: 'Guardado', detail: 'Marca guardada' });
      fetchSettings();
      fetchAssets();
    } catch {
      setToast({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
    } finally {
      setSavingBrand(false);
    }
  };

  const hasSocialConfig = !!(currentSettings?.xApiKey);

  if (!productId) {
    return (
      <div>
        <h2 className="text-xl font-bold text-[var(--foreground)] mt-0 mb-4">Configuración</h2>
        <Card className="!bg-[var(--card)] !text-[var(--card-foreground)] !border !border-[var(--card-border)] !rounded-[var(--radius-lg)]">
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <AlertCircle size={48} className="text-[var(--foreground-muted)]" />
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Selecciona un producto</h3>
            <p className="text-sm text-[var(--foreground-muted)] text-center max-w-md">
              Ve a <strong className="text-[var(--primary)]">Administración</strong>, selecciona un tenant y agrega o elige un producto.
              Las conexiones se configuran por producto.
            </p>
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors cursor-pointer border-none"
            >
              Ir a Admin
            </button>
          </div>
        </Card>
        {toast && (
          <div className="fixed bottom-4 right-4 z-50 px-4 py-3 rounded-[var(--radius-md)] shadow-lg text-sm font-medium text-white"
            style={{ backgroundColor: toast.severity === 'success' ? 'var(--success)' : 'var(--danger)' }}>
            {toast.detail}
          </div>
        )}
      </div>
    );
  }

  const renderField = (label: string, value: string, onChange: (v: string) => void, placeholder = '') => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.05em]">{label}</label>
      <InputText
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="!w-full !bg-[var(--input)] !text-[var(--foreground)] !border !border-[var(--input-border)] !rounded-[var(--radius-md)] !px-3 !py-2 !text-sm !placeholder:text-[var(--foreground-subtle)] focus:!border-[var(--input-focus)] focus:!ring-1 focus:!ring-[var(--ring)]"
      />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--foreground)] mt-0">Configuración de {productName}</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <span className="text-[var(--foreground-muted)] text-sm">Cargando...</span>
        </div>
      ) : (
        <Card className="!bg-[var(--card)] !text-[var(--card-foreground)] !border !border-[var(--card-border)] !rounded-[var(--radius-lg)]">
          <TabView
            activeIndex={activeTab}
            onTabChange={(value) => setActiveTab(value)}
            tabs={[
              {
                value: 'social',
                header: (
                  <div className="flex items-center gap-2">
                    <Twitter size={16} />
                    <span>Redes Sociales</span>
                  </div>
                ),
                children: (
                  <div className="flex flex-col gap-4 pt-4">
                    {hasSocialConfig && (
                      <div className="flex items-center gap-1.5 text-sm text-[var(--success)] font-medium">
                        <Check size={16} />
                        <span>Conectado</span>
                      </div>
                    )}
                    {renderField('API Key', xApiKey, setXApiKey)}
                    {renderField('API Secret', xApiSecret, setXApiSecret)}
                    {renderField('Access Token', xAccessToken, setXAccessToken)}
                    {renderField('Access Secret', xAccessSecret, setXAccessSecret)}
                    <button
                      onClick={handleSaveSocial}
                      disabled={savingSocial}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors cursor-pointer border-none mt-1"
                    >
                      <Save size={16} />
                      {savingSocial ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                ),
              },
              {
                value: 'google-ads',
                header: (
                  <div className="flex items-center gap-2">
                    <Globe size={16} />
                    <span>Google Ads</span>
                  </div>
                ),
                children: (
                  <div className="flex flex-col gap-4 pt-4">
                    {renderField('Developer Token', googleAdsDeveloperToken, setGoogleAdsDeveloperToken)}
                    {renderField('Client ID', googleAdsClientId, setGoogleAdsClientId, 'client-id.apps.googleusercontent.com')}
                    {renderField('Client Secret', googleAdsClientSecret, setGoogleAdsClientSecret)}
                    <button
                      onClick={handleSaveGoogleAds}
                      disabled={savingGoogleAds}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors cursor-pointer border-none mt-1"
                    >
                      <Save size={16} />
                      {savingGoogleAds ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                ),
              },
              {
                value: 'whatsapp',
                header: (
                  <div className="flex items-center gap-2">
                    <MessageCircle size={16} />
                    <span>WhatsApp</span>
                  </div>
                ),
                children: (
                  <div className="flex flex-col gap-4 pt-4">
                    {renderField('Phone Number ID', whatsappPhoneNumberId, setWhatsappPhoneNumberId)}
                    {renderField('Token', whatsappToken, setWhatsappToken)}
                    <button
                      onClick={handleSaveWhatsapp}
                      disabled={savingWhatsapp}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors cursor-pointer border-none mt-1"
                    >
                      <Save size={16} />
                      {savingWhatsapp ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                ),
              },
              {
                value: 'brand',
                header: (
                  <div className="flex items-center gap-2">
                    <Image size={16} />
                    <span>Marca</span>
                  </div>
                ),
                children: (
                  <div className="flex flex-col gap-4 pt-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.05em]">URL del Logo</label>
                      <InputText
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://ejemplo.com/logo.png"
                        className="!w-full !bg-[var(--input)] !text-[var(--foreground)] !border !border-[var(--input-border)] !rounded-[var(--radius-md)] !px-3 !py-2 !text-sm !placeholder:text-[var(--foreground-subtle)] focus:!border-[var(--input-focus)] focus:!ring-1 focus:!ring-[var(--ring)]"
                      />
                    </div>
                    {logoUrl && (
                      <div className="flex items-center justify-center border border-[var(--border)] rounded-[var(--radius-md)] p-4 bg-[var(--background-tertiary)]" style={{ minHeight: '120px' }}>
                        <img src={logoUrl} alt="Logo preview" style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }} onError={(e: any) => { e.target.style.display = 'none'; }} />
                      </div>
                    )}
                    <button
                      onClick={handleSaveBrand}
                      disabled={savingBrand}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors cursor-pointer border-none mt-1"
                    >
                      <Save size={16} />
                      {savingBrand ? 'Guardando...' : 'Guardar'}
                    </button>

                    <div className="mt-3">
                      <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">Assets subidos</h4>
                      {assets.length === 0 ? (
                        <p className="text-xs text-[var(--foreground-subtle)]">No hay archivos subidos aún.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {assets.map((asset: any, i: number) => (
                            <a
                              key={i}
                              href={asset.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors no-underline"
                            >
                              <Image size={14} />
                              {asset.name || `Archivo ${i + 1}`}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                value: 'product-context',
                header: (
                  <div className="flex items-center gap-2">
                    <Package size={16} />
                    <span>Contexto del Producto</span>
                  </div>
                ),
                children: (
                  <div className="flex flex-col gap-4 pt-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.05em]">Descripción del producto</label>
                      <Textarea
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        placeholder="Ej: OralTrack es un SaaS de gestión de pacientes para clínicas dentales con recordatorios automáticos, historial clínico digital y facturación integrada."
                        rows={4}
                        className="!w-full !bg-[var(--input)] !text-[var(--foreground)] !border !border-[var(--input-border)] !rounded-[var(--radius-md)] !px-3 !py-2 !text-sm !placeholder:text-[var(--foreground-subtle)] focus:!border-[var(--input-focus)] focus:!ring-1 focus:!ring-[var(--ring)] resize-none"
                      />
                      <p className="text-xs text-[var(--foreground-subtle)]">Esta descripción la usará Hermes para entender tu producto</p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.05em]">Mercado objetivo</label>
                      <Textarea
                        value={productTarget}
                        onChange={(e) => setProductTarget(e.target.value)}
                        placeholder="Ej: Clínicas dentales pequeñas y medianas en México y Latinoamérica, dueños de clínicas de 1-5 consultorios."
                        rows={2}
                        className="!w-full !bg-[var(--input)] !text-[var(--foreground)] !border !border-[var(--input-border)] !rounded-[var(--radius-md)] !px-3 !py-2 !text-sm !placeholder:text-[var(--foreground-subtle)] focus:!border-[var(--input-focus)] focus:!ring-1 focus:!ring-[var(--ring)] resize-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.05em]">Características clave (una por línea)</label>
                      <Textarea
                        value={productFeatures}
                        onChange={(e) => setProductFeatures(e.target.value)}
                        placeholder="Recordatorios automáticos vía WhatsApp&#10;Historial clínico digital&#10;Facturación electrónica integrada&#10;Dashboard de indicadores"
                        rows={4}
                        className="!w-full !bg-[var(--input)] !text-[var(--foreground)] !border !border-[var(--input-border)] !rounded-[var(--radius-md)] !px-3 !py-2 !text-sm !placeholder:text-[var(--foreground-subtle)] focus:!border-[var(--input-focus)] focus:!ring-1 focus:!ring-[var(--ring)] resize-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.05em]">Competidores (uno por línea)</label>
                      <Textarea
                        value={productCompetitors}
                        onChange={(e) => setProductCompetitors(e.target.value)}
                        placeholder="Dentalink&#10;ClinicCloud&#10;DentiMax"
                        rows={3}
                        className="!w-full !bg-[var(--input)] !text-[var(--foreground)] !border !border-[var(--input-border)] !rounded-[var(--radius-md)] !px-3 !py-2 !text-sm !placeholder:text-[var(--foreground-subtle)] focus:!border-[var(--input-focus)] focus:!ring-1 focus:!ring-[var(--ring)] resize-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.05em]">Sitio web</label>
                      <InputText
                        value={productWebsite}
                        onChange={(e) => setProductWebsite(e.target.value)}
                        placeholder="https://oraltrack.com"
                        className="!w-full !bg-[var(--input)] !text-[var(--foreground)] !border !border-[var(--input-border)] !rounded-[var(--radius-md)] !px-3 !py-2 !text-sm !placeholder:text-[var(--foreground-subtle)] focus:!border-[var(--input-focus)] focus:!ring-1 focus:!ring-[var(--ring)]"
                      />
                    </div>

                    <button
                      onClick={handleSaveProductContext}
                      disabled={savingProductContext}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[var(--radius-md)] text-sm font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors cursor-pointer border-none mt-1"
                    >
                      <Save size={16} />
                      {savingProductContext ? 'Guardando...' : 'Guardar Contexto'}
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-3 rounded-[var(--radius-md)] shadow-lg text-sm font-medium text-white"
          style={{ backgroundColor: toast.severity === 'success' ? 'var(--success)' : 'var(--danger)' }}>
          {toast.detail}
        </div>
      )}
    </div>
  );
}