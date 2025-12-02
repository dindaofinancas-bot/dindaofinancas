// Script CRÍTICO para aplicar tema IMEDIATAMENTE
// Este script executa ANTES do React carregar para evitar flash de cor

(function() {
  console.log('⚡ EXECUTANDO SCRIPT CRÍTICO DE TEMA...');
  
  // Detectar preferência do sistema IMEDIATAMENTE
  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const mode = isDark ? 'dark' : 'light';
  
  console.log(`🎨 Modo detectado: ${mode}`);
  
  // Temas padrão (hardcoded para velocidade máxima)
  const defaultThemes = {
    light: {
      background: '0 0% 0%', // Preto #000000
      foreground: '0 0% 96%', // Branco #F4F4F4
      primary: '177 84% 35%', // Verde/Teal #0FA7A0
      primaryForeground: '0 0% 96%', // Branco #F4F4F4
      secondary: '177 84% 35%', // Verde/Teal #0FA7A0
      secondaryForeground: '0 0% 96%', // Branco #F4F4F4
      muted: '240 4.8% 95.9%',
      mutedForeground: '240 3.8% 46.1%',
      border: '240 5.9% 90%',
      card: '0 0% 10%', // Card escuro para contraste
      cardForeground: '0 0% 96%', // Branco #F4F4F4
    },
    dark: {
      background: '0 0% 0%', // Preto #000000
      foreground: '0 0% 96%', // Branco #F4F4F4
      primary: '177 84% 35%', // Verde/Teal #0FA7A0
      primaryForeground: '0 0% 96%', // Branco #F4F4F4
      secondary: '177 84% 35%', // Verde/Teal #0FA7A0
      secondaryForeground: '0 0% 96%', // Branco #F4F4F4
      muted: '240 3.7% 15.9%',
      mutedForeground: '240 5% 64.9%',
      border: '240 3.7% 15.9%',
      card: '0 0% 10%', // Card escuro para contraste
      cardForeground: '0 0% 96%', // Branco #F4F4F4
    }
  };
  
  const config = defaultThemes[mode];
  
  // Aplicar CSS CRÍTICO no HEAD imediatamente
  const criticalStyle = document.createElement('style');
  criticalStyle.id = 'theme-critical-instant';
  criticalStyle.innerHTML = `
    :root {
      --background: ${config.background};
      --foreground: ${config.foreground};
      --primary: ${config.primary};
      --primary-foreground: ${config.primaryForeground};
      --secondary: ${config.secondary};
      --secondary-foreground: ${config.secondaryForeground};
      --muted: ${config.muted};
      --muted-foreground: ${config.mutedForeground};
      --border: ${config.border};
      --card: ${config.card};
      --card-foreground: ${config.cardForeground};
    }
    
    html {
      background-color: hsl(var(--background));
      transition: none !important;
    }
    
    body {
      background-color: hsl(var(--background));
      color: hsl(var(--foreground));
      transition: none !important;
      margin: 0;
      padding: 0;
    }
    
    * {
      transition: none !important;
    }
    
    /* Loading screen styles */
    .critical-loading {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: hsl(var(--background));
      color: hsl(var(--foreground));
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
    }
    
    .critical-loading-content {
      text-align: center;
    }
    
    .critical-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid hsl(var(--muted));
      border-top: 4px solid hsl(var(--primary));
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  
  // Inserir no início do HEAD para prioridade máxima
  document.head.insertBefore(criticalStyle, document.head.firstChild);
  
  // Aplicar background no HTML também
  document.documentElement.style.backgroundColor = `hsl(${config.background})`;
  
  console.log(`⚡ TEMA CRÍTICO APLICADO INSTANTANEAMENTE para ${mode} mode`);
  
  // Tentar carregar logo dinâmico para loading screen
  const logoUrl = `/api/logo?theme=${mode}`;
  
  // Adicionar loading screen temporário
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'critical-theme-loading';
  loadingDiv.className = 'critical-loading';
  
  // Tentar carregar logo primeiro
  const logoImg = new window.Image();
  logoImg.onload = function() {
    // Logo carregou, usar logo no loading
    loadingDiv.innerHTML = `
      <div class="critical-loading-content">
        <img src="${logoUrl}" alt="Logo" style="width: 200px; height: 50px; object-fit: contain; margin-bottom: 16px;">
        <p style="margin: 0; font-size: 14px; opacity: 0.7;">Carregando sistema...</p>
      </div>
    `;
  };
  logoImg.onerror = function() {
    // Logo não existe, usar fallback
    loadingDiv.innerHTML = `
      <div class="critical-loading-content">
        <div class="critical-spinner"></div>
        <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">Dindão Finanças</h2>
        <p style="margin: 0; font-size: 14px; opacity: 0.7;">Carregando sistema...</p>
      </div>
    `;
  };
  
  // Definir conteúdo padrão inicialmente
  loadingDiv.innerHTML = `
    <div class="critical-loading-content">
      <div class="critical-spinner"></div>
      <h2 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">Dindão Finanças</h2>
      <p style="margin: 0; font-size: 14px; opacity: 0.7;">Carregando sistema...</p>
    </div>
  `;
  
  // Tentar carregar logo
  logoImg.src = logoUrl;
  
  // Adicionar ao body quando estiver pronto
  if (document.body) {
    document.body.appendChild(loadingDiv);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(loadingDiv);
    });
  }
  
  // Remover loading screen quando React carregar
  window.removeCriticalLoading = function() {
    const loading = document.getElementById('critical-theme-loading');
    if (loading) {
      loading.style.opacity = '0';
      setTimeout(() => {
        loading.remove();
      }, 200);
    }
  };
  
})();