import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { getCurrentTenant, getCurrentProduct } from '../../stores/authStore';
import { settings } from '../../services/api';

export default function SettingsPage() {
  const tenant = getCurrentTenant();
  const product = getCurrentProduct();
  const productId = sessionStorage.getItem('currentProductId');
  const toast = useRef<Toast>(null);
  const navigate = useNavigate();

  // Estado general de settings
  const [currentSettings, setCurrentSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tab 1: Redes Sociales (X/Twitter)
  const [xApiKey, setXApiKey] = useState('');
  const [xApiSecret, setXApiSecret] = useState('');
  const [xAccessToken, setXAccessToken] = useState('');
  const [xAccessSecret, setXAccessSecret] = useState('');
  const [savingSocial, setSavingSocial] = useState(false);

  // Tab 2: Google Ads
  const [googleAdsDeveloperToken, setGoogleAdsDeveloperToken] = useState('');
  const [googleAdsClientId, setGoogleAdsClientId] = useState('');
  const [googleAdsClientSecret, setGoogleAdsClientSecret] = useState('');
  const [savingGoogleAds, setSavingGoogleAds] = useState(false);

  // Tab 3: WhatsApp
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState('');
  const [whatsappToken, setWhatsappToken] = useState('');
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  // Tab 4: Marca
  const [logoUrl, setLogoUrl] = useState('');
  const [assets, setAssets] = useState<any[]>([]);
  const [savingBrand, setSavingBrand] = useState(false);

  const productName = product?.name || 'MarketingOS';

  // Cargar settings actuales
  const fetchSettings = () => {
    if (!tenant || !productId) return;
    setLoading(true);
    settings
      .get(tenant.id, productId)
      .then((r) => {
        const data = r.data || {};
        setCurrentSettings(data);

        // X/Twitter
        setXApiKey(data.xApiKey || '');
        setXApiSecret(data.xApiSecret || '');
        setXAccessToken(data.xAccessToken || '');
        setXAccessSecret(data.xAccessSecret || '');

        // Google Ads
        setGoogleAdsDeveloperToken(data.googleAdsDeveloperToken || '');
        setGoogleAdsClientId(data.googleAdsClientId || '');
        setGoogleAdsClientSecret(data.googleAdsClientSecret || '');

        // WhatsApp
        setWhatsappPhoneNumberId(data.whatsappPhoneNumberId || '');
        setWhatsappToken(data.whatsappToken || '');

        // Marca
        setLogoUrl(data.logoUrl || '');
      })
      .catch(() => {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las configuraciones', life: 3000 });
      })
      .finally(() => setLoading(false));
  };

  // Cargar assets
  const fetchAssets = () => {
    if (!tenant || !productId) return;
    settings
      .getUploads(tenant.id, productId)
      .then((r) => setAssets(r.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchSettings();
  }, [tenant?.id, productId]);

  // Handlers de guardado
  const handleSaveSocial = async () => {
    if (!tenant || !productId) return;
    setSavingSocial(true);
    try {
      await settings.update(tenant.id, productId, {
        xApiKey,
        xApiSecret,
        xAccessToken,
        xAccessSecret,
      });
      toast.current?.show({ severity: 'success', summary: 'Guardado', detail: 'Configuración de redes sociales guardada', life: 2000 });
      fetchSettings();
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la configuración', life: 3000 });
    } finally {
      setSavingSocial(false);
    }
  };

  const handleSaveGoogleAds = async () => {
    if (!tenant || !productId) return;
    setSavingGoogleAds(true);
    try {
      await settings.update(tenant.id, productId, {
        googleAdsDeveloperToken,
        googleAdsClientId,
        googleAdsClientSecret,
      });
      toast.current?.show({ severity: 'success', summary: 'Guardado', detail: 'Configuración de Google Ads guardada', life: 2000 });
      fetchSettings();
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la configuración', life: 3000 });
    } finally {
      setSavingGoogleAds(false);
    }
  };

  const handleSaveWhatsapp = async () => {
    if (!tenant || !productId) return;
    setSavingWhatsapp(true);
    try {
      await settings.update(tenant.id, productId, {
        whatsappPhoneNumberId,
        whatsappToken,
      });
      toast.current?.show({ severity: 'success', summary: 'Guardado', detail: 'Configuración de WhatsApp guardada', life: 2000 });
      fetchSettings();
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la configuración', life: 3000 });
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const handleSaveBrand = async () => {
    if (!tenant || !productId) return;
    setSavingBrand(true);
    try {
      await settings.update(tenant.id, productId, { logoUrl });
      toast.current?.show({ severity: 'success', summary: 'Guardado', detail: 'Configuración de marca guardada', life: 2000 });
      fetchSettings();
      fetchAssets();
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la configuración', life: 3000 });
    } finally {
      setSavingBrand(false);
    }
  };

  // Helper: verificar si hay valores guardados
  const hasSocialConfig = !!(
    currentSettings?.xApiKey ||
    currentSettings?.xApiSecret ||
    currentSettings?.xAccessToken ||
    currentSettings?.xAccessSecret
  );

  // Render de cada tab
  const renderSocialTab = () => (
    <div className="flex flex-column gap-3">
      {hasSocialConfig && (
        <div className="text-green-600 font-bold flex align-items-center gap-1">
          <span>✅ Conectado</span>
        </div>
      )}
      <div className="field">
        <label htmlFor="xApiKey" className="font-medium block mb-1">API Key</label>
        <InputText id="xApiKey" type="password" value={xApiKey} onChange={(e) => setXApiKey(e.target.value)} className="w-full" placeholder="••••••••" />
      </div>
      <div className="field">
        <label htmlFor="xApiSecret" className="font-medium block mb-1">API Secret</label>
        <InputText id="xApiSecret" type="password" value={xApiSecret} onChange={(e) => setXApiSecret(e.target.value)} className="w-full" placeholder="••••••••" />
      </div>
      <div className="field">
        <label htmlFor="xAccessToken" className="font-medium block mb-1">Access Token</label>
        <InputText id="xAccessToken" type="password" value={xAccessToken} onChange={(e) => setXAccessToken(e.target.value)} className="w-full" placeholder="••••••••" />
      </div>
      <div className="field">
        <label htmlFor="xAccessSecret" className="font-medium block mb-1">Access Secret</label>
        <InputText id="xAccessSecret" type="password" value={xAccessSecret} onChange={(e) => setXAccessSecret(e.target.value)} className="w-full" placeholder="••••••••" />
      </div>
      <Button label="Guardar" icon="pi pi-check" onClick={handleSaveSocial} loading={savingSocial} className="w-full" />
    </div>
  );

  const renderGoogleAdsTab = () => (
    <div className="flex flex-column gap-3">
      <div className="field">
        <label htmlFor="googleAdsDeveloperToken" className="font-medium block mb-1">Developer Token</label>
        <InputText id="googleAdsDeveloperToken" type="password" value={googleAdsDeveloperToken} onChange={(e) => setGoogleAdsDeveloperToken(e.target.value)} className="w-full" placeholder="••••••••" />
      </div>
      <div className="field">
        <label htmlFor="googleAdsClientId" className="font-medium block mb-1">Client ID</label>
        <InputText id="googleAdsClientId" value={googleAdsClientId} onChange={(e) => setGoogleAdsClientId(e.target.value)} className="w-full" placeholder="client-id.apps.googleusercontent.com" />
      </div>
      <div className="field">
        <label htmlFor="googleAdsClientSecret" className="font-medium block mb-1">Client Secret</label>
        <InputText id="googleAdsClientSecret" type="password" value={googleAdsClientSecret} onChange={(e) => setGoogleAdsClientSecret(e.target.value)} className="w-full" placeholder="••••••••" />
      </div>
      <Button label="Guardar" icon="pi pi-check" onClick={handleSaveGoogleAds} loading={savingGoogleAds} className="w-full" />
    </div>
  );

  const renderWhatsappTab = () => (
    <div className="flex flex-column gap-3">
      <div className="field">
        <label htmlFor="whatsappPhoneNumberId" className="font-medium block mb-1">Phone Number ID</label>
        <InputText id="whatsappPhoneNumberId" value={whatsappPhoneNumberId} onChange={(e) => setWhatsappPhoneNumberId(e.target.value)} className="w-full" placeholder="123456789" />
      </div>
      <div className="field">
        <label htmlFor="whatsappToken" className="font-medium block mb-1">Token</label>
        <InputText id="whatsappToken" type="password" value={whatsappToken} onChange={(e) => setWhatsappToken(e.target.value)} className="w-full" placeholder="••••••••" />
      </div>
      <Button label="Guardar" icon="pi pi-check" onClick={handleSaveWhatsapp} loading={savingWhatsapp} className="w-full" />
    </div>
  );

  const renderBrandTab = () => (
    <div className="flex flex-column gap-3">
      <div className="field">
        <label htmlFor="logoUrl" className="font-medium block mb-1">URL del Logo</label>
        <InputText id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="w-full" placeholder="https://ejemplo.com/logo.png" />
      </div>
      {logoUrl && (
        <div className="flex align-items-center justify-content-center border-1 border-round p-3" style={{ minHeight: '120px', background: '#f8f9fa' }}>
          <img src={logoUrl} alt="Logo preview" style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }} onError={(e: any) => { e.target.style.display = 'none'; }} />
        </div>
      )}
      <Button label="Guardar" icon="pi pi-check" onClick={handleSaveBrand} loading={savingBrand} className="w-full" />

      <h4 className="mb-2 mt-3">Assets subidos</h4>
      {assets.length === 0 ? (
        <p className="text-500 text-sm">No hay archivos subidos aún.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {assets.map((asset: any, i: number) => (
            <a
              key={i}
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex align-items-center gap-1 border-1 border-round p-2 text-sm text-600 hover:text-primary"
            >
              <i className="pi pi-file" />
              {asset.name || `Archivo ${i + 1}`}
            </a>
          ))}
        </div>
      )}
    </div>
  );

  // Si no hay producto seleccionado, mostrar mensaje
  if (!productId) {
    return (
      <div>
        <Toast ref={toast} />
        <div className="flex justify-content-between align-items-center mb-3">
          <h2 className="mt-0">Configuración</h2>
        </div>
        <Card>
          <div className="text-center py-5">
            <i className="pi pi-info-circle" style={{ fontSize: '3rem', color: 'var(--blue-500)' }} />
            <h3 className="mt-3">Selecciona un producto</h3>
            <p className="text-lg mb-4">
              Ve a <strong>Administración</strong>, selecciona un tenant y agrega o elige un producto.
              Las conexiones se configuran por producto.
            </p>
            <Button label="Ir a Admin" icon="pi pi-cog" onClick={() => navigate('/admin')} />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Toast ref={toast} />

      <div className="flex justify-content-between align-items-center mb-3">
        <h2 className="mt-0">Configuración de {productName}</h2>
      </div>

      <Card>
        {loading ? (
          <div className="flex align-items-center justify-content-center p-5">
            <i className="pi pi-spin pi-spinner text-4xl text-primary" />
          </div>
        ) : (
          <TabView>
            <TabPanel header="Redes Sociales" leftIcon="pi pi-share-alt">
              {renderSocialTab()}
            </TabPanel>
            <TabPanel header="Google Ads" leftIcon="pi pi-google">
              {renderGoogleAdsTab()}
            </TabPanel>
            <TabPanel header="WhatsApp" leftIcon="pi pi-whatsapp">
              {renderWhatsappTab()}
            </TabPanel>
            <TabPanel header="Marca" leftIcon="pi pi-image">
              {renderBrandTab()}
            </TabPanel>
          </TabView>
        )}
      </Card>
    </div>
  );
}
