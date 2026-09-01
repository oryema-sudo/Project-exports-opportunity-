import React, { useState, useEffect } from 'react';
import { appStore, AppState } from './services/store';
import { UserRole } from './types';
import { Navigation, ActiveTab } from './components/Navigation';
import { HomePage } from './components/HomePage';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { ShipmentsView } from './components/ShipmentsView';
import { ShipmentDetailView } from './components/ShipmentDetailView';
import { LotsView } from './components/LotsView';
import { DeliveriesView } from './components/DeliveriesView';
import { FarmersView } from './components/FarmersView';
import { FarmMapView } from './components/FarmMapView';
import { DocumentsView } from './components/DocumentsView';
import { AuditTrailView } from './components/AuditTrailView';
import { OwnerDashboardView } from './components/OwnerDashboardView';
import { EvidencePackModal } from './components/EvidencePackModal';
import { BulkImportModal } from './components/BulkImportModal';
import { OrganizationModal } from './components/OrganizationModal';
import { AstroKahawaIcon } from './components/AstroKahawaLogo';
import { ShieldCheck, Info } from 'lucide-react';

export default function App() {
  const getInitialTab = (): ActiveTab => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['home', 'dashboard', 'shipments', 'lots', 'deliveries', 'farmers', 'map', 'documents', 'audit', 'owner'].includes(tabParam)) {
        return tabParam as ActiveTab;
      }
      const hash = window.location.hash.replace('#', '');
      if (hash && ['home', 'dashboard', 'shipments', 'lots', 'deliveries', 'farmers', 'map', 'documents', 'audit', 'owner'].includes(hash)) {
        return hash as ActiveTab;
      }
    } catch {
      // ignore
    }
    return 'home';
  };

  const [state, setState] = useState<AppState>(appStore.getState());
  const [activeTab, setActiveTabState] = useState<ActiveTab>(getInitialTab);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Auth Modal state
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'signup' | 'about' }>({
    isOpen: false,
    mode: 'login'
  });

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  };

  // Sync tab on popstate / hash change
  useEffect(() => {
    const handleUrlChange = () => {
      const tab = getInitialTab();
      setActiveTabState(tab);
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Modals
  const [showBulkImport, setShowBulkImport] = useState<boolean>(false);
  const [showOrgSettings, setShowOrgSettings] = useState<boolean>(false);
  const [evidencePackShipmentId, setEvidencePackShipmentId] = useState<string | null>(null);

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = appStore.subscribe((newState) => {
      setState({ ...newState });
    });
    return () => unsubscribe();
  }, []);

  const handleSelectShipment = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId);
    setActiveTab('shipments');
  };

  const handleDownloadGeoJson = (shipmentId: string) => {
    const shipment = state.shipments.find(s => s.id === shipmentId);
    if (!shipment) return;

    const geoData = appStore.generateShipmentGeoJson(shipmentId);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geoData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Uganda_Coffee_Farm_Polygons_${shipment.exportReference}.geojson`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRoleChange = (role: UserRole) => {
    appStore.switchUserRole(role);
  };

  const handleOrgChange = (orgId: string) => {
    appStore.switchOrganization(orgId);
  };

  const handleResetData = () => {
    if (window.confirm('Reset workspace to standard Uganda Coffee export seed dataset?')) {
      appStore.resetToSeedData();
      setSelectedShipmentId(null);
    }
  };

  const handleOpenAuthModal = (mode: 'login' | 'signup' | 'about' = 'login') => {
    setAuthModal({ isOpen: true, mode });
  };

  const selectedShipment = state.shipments.find(s => s.id === selectedShipmentId);
  const selectedShipmentScorecard = selectedShipmentId ? appStore.getShipmentScorecard(selectedShipmentId) : null;

  // If in 'home' tab, render dedicated HomePage
  if (activeTab === 'home') {
    return (
      <>
        <HomePage 
          onEnterApp={() => setActiveTab('dashboard')} 
        />
        {/* Modals available globally */}
        <AuthModal
          isOpen={authModal.isOpen}
          onClose={() => setAuthModal(prev => ({ ...prev, isOpen: false }))}
          initialMode={authModal.mode}
          onSuccess={() => setActiveTab('dashboard')}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* Primary Top Bar & Nav */}
      <Navigation
        state={state}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'shipments') {
            setSelectedShipmentId(null);
          }
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenBulkImport={() => setShowBulkImport(true)}
        onOpenNewFarmer={() => setActiveTab('farmers')}
        onOpenNewLot={() => setActiveTab('lots')}
        onOpenNewShipment={() => {
          setSelectedShipmentId(null);
          setActiveTab('shipments');
        }}
        onOpenOrgSettings={() => setShowOrgSettings(true)}
        onSelectOrg={handleOrgChange}
        onRoleChange={handleRoleChange}
        onResetData={handleResetData}
        onOpenAuth={handleOpenAuthModal}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Render Active View */}
        {activeTab === 'dashboard' && (
          <Dashboard
            state={state}
            setActiveTab={setActiveTab}
            onSelectShipment={handleSelectShipment}
            onOpenBulkImport={() => setShowBulkImport(true)}
            onOpenNewShipment={() => {
              setSelectedShipmentId(null);
              setActiveTab('shipments');
            }}
          />
        )}

        {activeTab === 'shipments' && (
          selectedShipment && selectedShipmentScorecard ? (
            <ShipmentDetailView
              shipment={selectedShipment}
              scorecard={selectedShipmentScorecard}
              onBack={() => setSelectedShipmentId(null)}
              onOpenEvidencePack={(id) => setEvidencePackShipmentId(id)}
              onOpenGeoJsonDownload={handleDownloadGeoJson}
            />
          ) : (
            <ShipmentsView
              state={state}
              onSelectShipment={handleSelectShipment}
              searchQuery={searchQuery}
            />
          )
        )}

        {activeTab === 'lots' && (
          <LotsView
            state={state}
            searchQuery={searchQuery}
            onSelectShipment={handleSelectShipment}
          />
        )}

        {activeTab === 'deliveries' && (
          <DeliveriesView
            state={state}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'farmers' && (
          <FarmersView
            state={state}
            searchQuery={searchQuery}
            onOpenBulkImport={() => setShowBulkImport(true)}
          />
        )}

        {activeTab === 'map' && (
          <FarmMapView
            state={state}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsView
            state={state}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'audit' && (
          <AuditTrailView
            state={state}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === 'owner' && (
          <OwnerDashboardView
            state={state}
          />
        )}

      </main>

      {/* Global Regulatory Footer */}
      <footer className="bg-stone-900 border-t border-stone-800 text-stone-400 text-xs py-4 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div className="flex items-center gap-2">
            <AstroKahawaIcon size={20} showBackground={false} />
            <span className="text-[11px] text-stone-300">
              <strong className="text-stone-100 uppercase tracking-tight">ASTROKAHAWA:</strong> From origin to export, with evidence.
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-stone-500 font-mono">
            <button 
              onClick={() => setActiveTab('home')} 
              className="text-emerald-400 hover:underline cursor-pointer"
            >
              Public Home Page
            </button>
            <span>•</span>
            <button 
              onClick={() => handleOpenAuthModal('about')} 
              className="text-stone-400 hover:text-stone-200 cursor-pointer"
            >
              About Us
            </button>
            <span>•</span>
            <span>UCDA Workflow Compliant</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {showBulkImport && (
        <BulkImportModal
          onClose={() => setShowBulkImport(false)}
          onSuccess={() => {
            setActiveTab('farmers');
          }}
        />
      )}

      {showOrgSettings && (
        <OrganizationModal
          onClose={() => setShowOrgSettings(false)}
        />
      )}

      {evidencePackShipmentId && (
        <EvidencePackModal
          shipmentId={evidencePackShipmentId}
          onClose={() => setEvidencePackShipmentId(null)}
        />
      )}

      {/* Auth Modal for Log In, Sign Up, About Us */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal(prev => ({ ...prev, isOpen: false }))}
        initialMode={authModal.mode}
        onSuccess={() => setActiveTab('dashboard')}
      />

    </div>
  );
}
