/**
 * Frizerino Booking Widget v1.0
 * Professional embeddable booking widget
 * 
 * Usage:
 * <div id="frizerino-widget"></div>
 * <script src="https://frizerino.com/widget.js" 
 *         data-salon="salon-slug" 
 *         data-key="frzn_live_xxx"
 *         data-theme="light"
 *         data-primary-color="#FF6B35"
 *         data-button-text="Rezerviši termin">
 * </script>
 */
(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.__FRIZERINO_WIDGET_LOADED__) {
    return;
  }
  window.__FRIZERINO_WIDGET_LOADED__ = true;

  // Get script element and config
  var script = document.currentScript || document.querySelector('script[data-salon]');
  if (!script) {
    console.error('Frizerino Widget: Script element not found');
    return;
  }

  var config = {
    salon: script.getAttribute('data-salon'),
    apiKey: script.getAttribute('data-key'),
    containerId: script.getAttribute('data-container') || 'frizerino-widget',
    theme: script.getAttribute('data-theme') || 'light',
    primaryColor: script.getAttribute('data-primary-color') || '#FF6B35',
    buttonText: script.getAttribute('data-button-text') || 'Rezerviši termin',
    buttonRadius: script.getAttribute('data-button-radius') || '8px',
    fontFamily: script.getAttribute('data-font') || 'system-ui, -apple-system, sans-serif',
    locale: script.getAttribute('data-locale') || 'bs',
    bgOpacity: parseFloat(script.getAttribute('data-bg-opacity')) || 1,
    bgColor: script.getAttribute('data-bg-color') || null,
    textColor: script.getAttribute('data-text-color') || null,
    borderColor: script.getAttribute('data-border-color') || null,
    showShadow: script.getAttribute('data-shadow') !== 'false',
    apiUrl: 'https://api.frizerino.com/api/v1'
  };

  if (!config.salon || !config.apiKey) {
    console.error('Frizerino Widget: data-salon and data-key are required');
    return;
  }

  // Widget state
  var state = {
    salon: null,
    services: [],
    staff: [],
    settings: {},
    selectedServices: [],
    selectedStaff: null,
    selectedDate: null,
    selectedTime: null,
    availableSlots: [],
    availableDates: [], // Dates with available slots
    unavailableDates: [], // Dates without available slots (fully booked or closed)
    loadingDates: false,
    step: 1,
    loading: true,
    error: null
  };

  // Computed colors based on config
  var bgDefault = config.theme === 'dark' ? '#1a1a1a' : '#ffffff';
  var bgFinal = config.bgColor || bgDefault;
  var textDefault = config.theme === 'dark' ? '#fff' : '#333';
  var textFinal = config.textColor || textDefault;
  var borderDefault = config.theme === 'dark' ? '#333' : '#e5e5e5';
  var borderFinal = config.borderColor || borderDefault;

  // Styles
  var styles = `
    .frzn-widget {
      font-family: ${config.fontFamily};
      max-width: 500px;
      margin: 0 auto;
      background: ${config.bgOpacity < 1 ? hexToRgba(bgFinal, config.bgOpacity) : bgFinal};
      border-radius: 16px;
      ${config.showShadow ? 'box-shadow: 0 4px 24px rgba(0,0,0,0.12);' : ''}
      overflow: hidden;
    }
    .frzn-widget * { box-sizing: border-box; margin: 0; padding: 0; }
    .frzn-body { padding: 20px; }
    .frzn-step { display: none; }
    .frzn-step.active { display: block; }
    .frzn-step-title { font-size: 1rem; font-weight: 600; color: ${textFinal}; margin-bottom: 16px; }
    .frzn-services, .frzn-staff, .frzn-times { display: flex; flex-direction: column; gap: 8px; }
    .frzn-service-item, .frzn-staff-item, .frzn-time-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border: 2px solid ${borderFinal};
      border-radius: ${config.buttonRadius};
      cursor: pointer;
      transition: all 0.2s;
      background: ${config.bgOpacity < 1 ? 'transparent' : (config.theme === 'dark' ? '#2a2a2a' : '#fff')};
      color: ${textFinal};
    }
    .frzn-service-item:hover, .frzn-staff-item:hover, .frzn-time-item:hover {
      border-color: ${config.primaryColor};
      background: ${config.theme === 'dark' ? '#333' : '#fafafa'};
    }
    .frzn-service-item.selected, .frzn-staff-item.selected, .frzn-time-item.selected {
      border-color: ${config.primaryColor};
      background: ${hexToRgba(config.primaryColor, 0.1)};
    }
    .frzn-service-info { flex: 1; }
    .frzn-service-name { font-weight: 500; font-size: 0.95rem; }
    .frzn-service-meta { font-size: 0.8rem; color: ${config.textColor || (config.theme === 'dark' ? '#aaa' : '#666')}; opacity: 0.7; margin-top: 2px; }
    .frzn-service-price { font-weight: 600; color: ${config.primaryColor}; }
    .frzn-category { margin-bottom: 16px; }
    .frzn-category-title { font-weight: 600; font-size: 0.9rem; color: ${config.primaryColor}; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid ${hexToRgba(config.primaryColor, 0.2)}; }
    .frzn-staff-avatar {
      width: 48px; height: 48px; border-radius: 50%; margin-right: 12px;
      background: ${config.primaryColor}; display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 600; font-size: 1.1rem;
    }
    .frzn-staff-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
    .frzn-calendar { margin-bottom: 16px; }
    .frzn-calendar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .frzn-calendar-nav { background: none; border: none; cursor: pointer; padding: 8px; color: ${config.primaryColor}; font-size: 1.2rem; }
    .frzn-calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; }
    .frzn-calendar-day { padding: 8px 4px; font-size: 0.8rem; color: ${textFinal}; opacity: 0.6; }
    .frzn-calendar-date {
      padding: 8px 4px; border-radius: 8px; cursor: pointer; font-size: 0.9rem;
      color: ${textFinal}; transition: all 0.2s;
    }
    .frzn-calendar-date:hover:not(.disabled) { background: ${hexToRgba(config.primaryColor, 0.1)}; }
    .frzn-calendar-date.selected { background: ${config.primaryColor}; color: white; }
    .frzn-calendar-date.disabled { color: ${config.theme === 'dark' ? '#555' : '#ccc'}; cursor: not-allowed; }
    .frzn-calendar-date.today { font-weight: 600; }
    .frzn-times-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .frzn-time-item { justify-content: center; padding: 10px; font-size: 0.9rem; }
    .frzn-form { display: flex; flex-direction: column; gap: 12px; }
    .frzn-input {
      width: 100%; padding: 12px 16px; border: 2px solid ${borderFinal};
      border-radius: ${config.buttonRadius}; font-size: 0.95rem;
      background: ${config.bgOpacity < 1 ? 'rgba(255,255,255,0.1)' : (config.theme === 'dark' ? '#2a2a2a' : '#fff')};
      color: ${textFinal};
    }
    .frzn-input:focus { outline: none; border-color: ${config.primaryColor}; }
    .frzn-input::placeholder { color: ${textFinal}; opacity: 0.5; }
    textarea.frzn-input { color: ${textFinal} !important; }
    .frzn-btn {
      width: 100%; padding: 14px 24px; border: none; border-radius: ${config.buttonRadius};
      font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .frzn-btn-primary {
      background: linear-gradient(135deg, ${config.primaryColor}, ${adjustColor(config.primaryColor, -15)});
      color: white;
    }
    .frzn-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px ${hexToRgba(config.primaryColor, 0.4)}; }
    .frzn-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .frzn-btn-secondary {
      background: ${config.theme === 'dark' ? '#333' : '#f5f5f5'};
      color: ${config.theme === 'dark' ? '#fff' : '#333'};
    }
    .frzn-footer { display: flex; gap: 8px; margin-top: 16px; }
    .frzn-footer .frzn-btn { flex: 1; }
    .frzn-loading { text-align: center; padding: 40px; color: ${config.theme === 'dark' ? '#aaa' : '#666'}; }
    .frzn-spinner { width: 40px; height: 40px; border: 3px solid ${config.theme === 'dark' ? '#333' : '#e5e5e5'}; border-top-color: ${config.primaryColor}; border-radius: 50%; animation: frzn-spin 0.8s linear infinite; margin: 0 auto 12px; }
    @keyframes frzn-spin { to { transform: rotate(360deg); } }
    .frzn-error { text-align: center; padding: 40px; color: #e53935; }
    .frzn-success { text-align: center; padding: 40px; }
    .frzn-success-icon { width: 64px; height: 64px; background: #4CAF50; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; }
    .frzn-success-icon svg { width: 32px; height: 32px; color: white; }
    .frzn-summary { background: ${config.bgOpacity < 1 ? 'rgba(0,0,0,0.05)' : (config.theme === 'dark' ? '#2a2a2a' : '#f9f9f9')}; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
    .frzn-summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${borderFinal}; color: ${textFinal}; }
    .frzn-summary-row:last-child { border-bottom: none; font-weight: 600; }
    .frzn-powered { text-align: center; padding: 12px; font-size: 0.75rem; color: ${config.theme === 'dark' ? '#666' : '#999'}; }
    .frzn-powered a { color: ${config.primaryColor}; text-decoration: none; }
  `;

  // Helper functions
  function adjustColor(hex, percent) {
    var num = parseInt(hex.replace('#', ''), 16);
    var r = Math.min(255, Math.max(0, (num >> 16) + percent));
    var g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
    var b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
    return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
  }

  function hexToRgba(hex, alpha) {
    var num = parseInt(hex.replace('#', ''), 16);
    return 'rgba(' + (num >> 16) + ',' + ((num >> 8) & 0x00FF) + ',' + (num & 0x0000FF) + ',' + alpha + ')';
  }


  // API functions with retry logic
  function apiRequest(endpoint, options, retryCount) {
    options = options || {};
    retryCount = retryCount || 0;
    var maxRetries = 3;
    var url = config.apiUrl + endpoint;
    var headers = {
      'Content-Type': 'application/json',
      'X-Widget-Key': config.apiKey
    };
    
    return fetch(url, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    }).then(function(res) {
      return res.json().then(function(data) {
        if (!res.ok) {
          var error = new Error(data.error || 'API Error: ' + res.status);
          error.code = data.code;
          error.redirectToTime = data.redirect_to_time;
          error.status = res.status;
          throw error;
        }
        return data;
      });
    }).catch(function(err) {
      // Retry on 401 or network errors (might be timing issue)
      if (retryCount < maxRetries && (err.status === 401 || !err.status)) {
        var delay = Math.pow(2, retryCount) * 500; // 500ms, 1s, 2s
        return new Promise(function(resolve) {
          setTimeout(resolve, delay);
        }).then(function() {
          return apiRequest(endpoint, options, retryCount + 1);
        });
      }
      throw err;
    });
  }

  function loadSalonData() {
    return apiRequest('/widget/' + config.salon + '?key=' + config.apiKey);
  }

  function loadAvailableSlots(staffId, date, services) {
    return apiRequest('/widget/slots/available', {
      method: 'POST',
      body: {
        key: config.apiKey,
        staff_id: staffId,
        date: date,
        services: services
      }
    });
  }

  function createBooking(data) {
    return apiRequest('/widget/book', {
      method: 'POST',
      body: Object.assign({ api_key: config.apiKey }, data)
    });
  }

  function loadAvailableDates(staffId, month, services) {
    return apiRequest('/widget/dates/available', {
      method: 'POST',
      body: {
        key: config.apiKey,
        staff_id: staffId,
        month: month,
        services: services
      }
    });
  }

  // Load available dates when entering step 3 or changing month
  function loadDatesForMonth() {
    if (!state.selectedStaff || state.selectedServices.length === 0) return;
    
    var today = new Date();
    // Use explicit undefined check to handle month 0 (January) correctly
    var currentMonth = state.calendarMonth !== undefined ? state.calendarMonth : today.getMonth();
    var currentYear = state.calendarYear !== undefined ? state.calendarYear : today.getFullYear();
    var monthStr = currentYear + '-' + String(currentMonth + 1).padStart(2, '0');
    
    var services = state.selectedServices.map(function(s) {
      return { serviceId: s.id.toString(), duration: s.duration };
    });
    
    state.loadingDates = true;
    render();
    
    loadAvailableDates(state.selectedStaff.id, monthStr, services)
      .then(function(data) {
        state.availableDates = data.available_dates || [];
        state.unavailableDates = data.unavailable_dates || [];
        state.loadingDates = false;
        render();
      })
      .catch(function(err) {
        console.error('Error loading available dates:', err);
        state.loadingDates = false;
        render();
      });
  }

  // Render functions
  function render() {
    var container = document.getElementById(config.containerId);
    if (!container) {
      console.error('Frizerino Widget: Container #' + config.containerId + ' not found');
      return;
    }

    // Inject styles
    if (!document.getElementById('frzn-styles')) {
      var styleEl = document.createElement('style');
      styleEl.id = 'frzn-styles';
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);
    }

    if (state.loading) {
      container.innerHTML = renderLoading();
      return;
    }

    if (state.error) {
      container.innerHTML = renderError();
      return;
    }

    container.innerHTML = renderWidget();
    attachEventListeners();
  }

  function renderLoading() {
    return '<div class="frzn-widget"><div class="frzn-loading"><div class="frzn-spinner"></div><p>Učitavanje...</p></div></div>';
  }

  function renderError() {
    return '<div class="frzn-widget"><div class="frzn-error"><p>' + (state.error || 'Greška pri učitavanju') + '</p></div></div>';
  }

  function renderWidget() {
    return '<div class="frzn-widget">' +
      '<div class="frzn-body">' +
        renderStep1() +
        renderStep2() +
        renderStep3() +
        renderStep4() +
        renderStep5() +
      '</div>' +
      '<div class="frzn-powered">Powered by <a href="https://frizerino.com" target="_blank">Frizerino</a></div>' +
    '</div>';
  }

  // Helper to render a single service item
  function renderServiceItem(s) {
    var selected = state.selectedServices.some(function(ss) { return ss.id === s.id; });
    // Show all services including 0-duration (addons)
    var durationHtml = s.duration > 0 ? '<div class="frzn-service-meta">' + s.duration + ' min</div>' : '';
    return '<div class="frzn-service-item' + (selected ? ' selected' : '') + '" data-service-id="' + s.id + '">' +
      '<div class="frzn-service-info">' +
        '<div class="frzn-service-name">' + s.name + '</div>' +
        durationHtml +
      '</div>' +
      '<div class="frzn-service-price">' + (s.discount_price || s.price) + ' KM</div>' +
    '</div>';
  }

  function renderStep1() {
    var servicesHtml = '';
    var settings = state.settings || {};
    var displayMode = settings.service_display || 'list'; // 'list' or 'categories'

    if (displayMode === 'categories') {
      // Group services by category
      var categories = {};
      state.services.forEach(function(s) {
        var cat = s.category || 'Ostalo';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(s);
      });

      // Get category order from salon settings
      var categoryOrder = (state.salon && state.salon.category_order) || [];
      var categoryNames = Object.keys(categories);
      
      // Sort categories: first by custom order, then alphabetically for unordered
      categoryNames.sort(function(a, b) {
        var indexA = categoryOrder.indexOf(a);
        var indexB = categoryOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });

      // Render by category in sorted order
      categoryNames.forEach(function(catName) {
        var catServices = categories[catName];
        var catServicesHtml = catServices.map(renderServiceItem).filter(Boolean).join('');
        if (catServicesHtml) {
          servicesHtml += '<div class="frzn-category">' +
            '<div class="frzn-category-title">' + catName + '</div>' +
            '<div class="frzn-services">' + catServicesHtml + '</div>' +
          '</div>';
        }
      });
    } else {
      // Simple list (default) - services already sorted by display_order from backend
      servicesHtml = '<div class="frzn-services">' + 
        state.services.map(renderServiceItem).filter(Boolean).join('') + 
      '</div>';
    }

    return '<div class="frzn-step' + (state.step === 1 ? ' active' : '') + '" data-step="1">' +
      '<div class="frzn-step-title">Odaberite uslugu</div>' +
      servicesHtml +
      '<div class="frzn-footer">' +
        '<button class="frzn-btn frzn-btn-primary" data-action="next" ' + (state.selectedServices.length === 0 ? 'disabled' : '') + '>Dalje</button>' +
      '</div>' +
    '</div>';
  }

  function renderStep2() {
    var staffHtml = state.staff.map(function(s) {
      var selected = state.selectedStaff && state.selectedStaff.id === s.id;
      var initials = s.name.split(' ').map(function(n) { return n[0]; }).join('').toUpperCase();
      // Only show rating if > 0
      var ratingHtml = (s.rating && s.rating > 0) ? ' • ⭐ ' + s.rating : '';
      return '<div class="frzn-staff-item' + (selected ? ' selected' : '') + '" data-staff-id="' + s.id + '">' +
        '<div class="frzn-staff-avatar">' + (s.avatar ? '<img src="' + s.avatar + '" alt="' + s.name + '">' : initials) + '</div>' +
        '<div class="frzn-service-info">' +
          '<div class="frzn-service-name">' + s.name + '</div>' +
          '<div class="frzn-service-meta">' + (s.role || 'Frizer') + ratingHtml + '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="frzn-step' + (state.step === 2 ? ' active' : '') + '" data-step="2">' +
      '<div class="frzn-step-title">Odaberite frizera</div>' +
      '<div class="frzn-staff">' + staffHtml + '</div>' +
      '<div class="frzn-footer">' +
        '<button class="frzn-btn frzn-btn-secondary" data-action="prev">Nazad</button>' +
        '<button class="frzn-btn frzn-btn-primary" data-action="next" ' + (!state.selectedStaff ? 'disabled' : '') + '>Dalje</button>' +
      '</div>' +
    '</div>';
  }


  // Helper to check if a day is working day based on salon working_hours
  function isDayWorking(date) {
    if (!state.salon || !state.salon.working_hours) return true;
    var dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    var dayName = dayNames[date.getDay()];
    var dayHours = state.salon.working_hours[dayName];
    return dayHours && dayHours.is_open;
  }

  // Check if date has available slots (from API response)
  function isDateAvailable(date) {
    var isoDate = date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0');
    
    // If we have loaded dates, check against them
    if (state.availableDates.length > 0 || state.unavailableDates.length > 0) {
      return state.availableDates.indexOf(isoDate) !== -1;
    }
    
    // Fallback to working day check if dates not loaded yet
    return isDayWorking(date);
  }

  function renderStep3() {
    var today = new Date();
    // Use explicit undefined check to handle month 0 (January) correctly
    var currentMonth = state.calendarMonth !== undefined ? state.calendarMonth : today.getMonth();
    var currentYear = state.calendarYear !== undefined ? state.calendarYear : today.getFullYear();
    var monthNames = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni', 'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
    // Start week from Monday (European format)
    var dayNames = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];
    
    // Get first day of month (0=Sunday, 1=Monday, etc.)
    var firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    // Convert to Monday-based (Monday=0, Sunday=6)
    var firstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    var calendarHtml = '<div class="frzn-calendar">' +
      '<div class="frzn-calendar-header">' +
        '<button class="frzn-calendar-nav" data-action="prev-month">‹</button>' +
        '<span>' + monthNames[currentMonth] + ' ' + currentYear + '</span>' +
        '<button class="frzn-calendar-nav" data-action="next-month">›</button>' +
      '</div>';
    
    // Show loading indicator while loading dates
    if (state.loadingDates) {
      calendarHtml += '<div class="frzn-loading" style="padding:20px;"><div class="frzn-spinner"></div><p>Učitavanje dostupnih datuma...</p></div>';
    } else {
      calendarHtml += '<div class="frzn-calendar-grid">';
      
      dayNames.forEach(function(d) { calendarHtml += '<div class="frzn-calendar-day">' + d + '</div>'; });
      
      for (var i = 0; i < firstDay; i++) { calendarHtml += '<div></div>'; }
      
      for (var day = 1; day <= daysInMonth; day++) {
        var date = new Date(currentYear, currentMonth, day);
        var dateStr = formatDate(date);
        var isToday = date.toDateString() === today.toDateString();
        var isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
        var isSelected = state.selectedDate === dateStr;
        var isNonWorking = !isDayWorking(date);
        var hasNoSlots = !isDateAvailable(date);
        
        var classes = 'frzn-calendar-date';
        if (isToday) classes += ' today';
        if (isPast || isNonWorking || hasNoSlots) classes += ' disabled';
        if (isSelected && !isNonWorking && !hasNoSlots) classes += ' selected';
        
        calendarHtml += '<div class="' + classes + '" data-date="' + dateStr + '">' + day + '</div>';
      }
      
      calendarHtml += '</div>';
    }
    
    calendarHtml += '</div>';

    var timesHtml = '';
    if (state.selectedDate && state.availableSlots.length > 0) {
      timesHtml = '<div class="frzn-step-title">Odaberite vrijeme</div><div class="frzn-times-grid">' +
        state.availableSlots.map(function(slot) {
          var selected = state.selectedTime === slot;
          return '<div class="frzn-time-item' + (selected ? ' selected' : '') + '" data-time="' + slot + '">' + slot + '</div>';
        }).join('') + '</div>';
    } else if (state.selectedDate && state.loadingSlots) {
      timesHtml = '<div class="frzn-loading"><div class="frzn-spinner"></div><p>Učitavanje termina...</p></div>';
    } else if (state.selectedDate) {
      timesHtml = '<p style="text-align:center;color:#999;padding:20px;">Nema dostupnih termina za ovaj datum</p>';
    }

    return '<div class="frzn-step' + (state.step === 3 ? ' active' : '') + '" data-step="3">' +
      '<div class="frzn-step-title">Odaberite datum i vrijeme</div>' +
      calendarHtml + timesHtml +
      '<div class="frzn-footer">' +
        '<button class="frzn-btn frzn-btn-secondary" data-action="prev">Nazad</button>' +
        '<button class="frzn-btn frzn-btn-primary" data-action="next" ' + (!state.selectedTime ? 'disabled' : '') + '>Dalje</button>' +
      '</div>' +
    '</div>';
  }

  function renderStep4() {
    return '<div class="frzn-step' + (state.step === 4 ? ' active' : '') + '" data-step="4">' +
      '<div class="frzn-step-title">Vaši podaci</div>' +
      '<div class="frzn-form">' +
        '<input type="text" class="frzn-input" id="frzn-name" placeholder="Ime i prezime *" required>' +
        '<input type="tel" class="frzn-input" id="frzn-phone" placeholder="Telefon *" required>' +
        '<input type="email" class="frzn-input" id="frzn-email" placeholder="Email (opciono)">' +
        '<textarea class="frzn-input" id="frzn-notes" placeholder="Napomena (opciono)" rows="2"></textarea>' +
      '</div>' +
      '<div class="frzn-footer">' +
        '<button class="frzn-btn frzn-btn-secondary" data-action="prev">Nazad</button>' +
        '<button class="frzn-btn frzn-btn-primary" data-action="next">Pregled</button>' +
      '</div>' +
    '</div>';
  }

  function renderStep5() {
    var totalPrice = state.selectedServices.reduce(function(sum, s) { return sum + (s.discount_price || s.price); }, 0);
    var totalDuration = state.selectedServices.reduce(function(sum, s) { return sum + s.duration; }, 0);
    
    var summaryHtml = '<div class="frzn-summary">' +
      state.selectedServices.map(function(s) {
        return '<div class="frzn-summary-row"><span>' + s.name + '</span><span>' + (s.discount_price || s.price) + ' KM</span></div>';
      }).join('') +
      '<div class="frzn-summary-row"><span>Ukupno (' + totalDuration + ' min)</span><span>' + totalPrice + ' KM</span></div>' +
    '</div>';

    return '<div class="frzn-step' + (state.step === 5 ? ' active' : '') + '" data-step="5">' +
      '<div class="frzn-step-title">Pregled rezervacije</div>' +
      summaryHtml +
      '<div style="margin-bottom:16px;font-size:0.9rem;color:' + (config.theme === 'dark' ? '#aaa' : '#666') + '">' +
        '<p><strong>Frizer:</strong> ' + (state.selectedStaff ? state.selectedStaff.name : '') + '</p>' +
        '<p><strong>Datum:</strong> ' + (state.selectedDate || '') + '</p>' +
        '<p><strong>Vrijeme:</strong> ' + (state.selectedTime || '') + '</p>' +
      '</div>' +
      '<div class="frzn-footer">' +
        '<button class="frzn-btn frzn-btn-secondary" data-action="prev">Nazad</button>' +
        '<button class="frzn-btn frzn-btn-primary" data-action="book" id="frzn-book-btn">' + config.buttonText + '</button>' +
      '</div>' +
    '</div>';
  }

  function formatDate(date) {
    var d = date.getDate().toString().padStart(2, '0');
    var m = (date.getMonth() + 1).toString().padStart(2, '0');
    var y = date.getFullYear();
    return d + '.' + m + '.' + y;
  }


  // Event handlers
  function attachEventListeners() {
    var container = document.getElementById(config.containerId);
    if (!container) return;

    // Service selection
    container.querySelectorAll('.frzn-service-item').forEach(function(el) {
      el.addEventListener('click', function() {
        var serviceId = parseInt(this.getAttribute('data-service-id'));
        var service = state.services.find(function(s) { return s.id === serviceId; });
        if (!service) return;
        
        var index = state.selectedServices.findIndex(function(s) { return s.id === serviceId; });
        if (index > -1) {
          state.selectedServices.splice(index, 1);
        } else {
          state.selectedServices.push(service);
        }
        render();
      });
    });

    // Staff selection
    container.querySelectorAll('.frzn-staff-item').forEach(function(el) {
      el.addEventListener('click', function() {
        var staffId = parseInt(this.getAttribute('data-staff-id'));
        state.selectedStaff = state.staff.find(function(s) { return s.id === staffId; });
        render();
      });
    });

    // Date selection
    container.querySelectorAll('.frzn-calendar-date:not(.disabled)').forEach(function(el) {
      el.addEventListener('click', function() {
        state.selectedDate = this.getAttribute('data-date');
        state.selectedTime = null;
        state.availableSlots = [];
        state.loadingSlots = true;
        render();
        
        // Load available slots
        var services = state.selectedServices.map(function(s) {
          return { serviceId: s.id.toString(), duration: s.duration };
        });
        loadAvailableSlots(state.selectedStaff.id, state.selectedDate, services)
          .then(function(data) {
            state.availableSlots = data.slots || [];
            state.loadingSlots = false;
            render();
          })
          .catch(function(err) {
            console.error('Error loading slots:', err);
            state.availableSlots = [];
            state.loadingSlots = false;
            render();
          });
      });
    });

    // Time selection
    container.querySelectorAll('.frzn-time-item').forEach(function(el) {
      el.addEventListener('click', function() {
        state.selectedTime = this.getAttribute('data-time');
        render();
      });
    });

    // Calendar navigation
    container.querySelectorAll('[data-action="prev-month"]').forEach(function(el) {
      el.addEventListener('click', function() {
        var today = new Date();
        // Use explicit undefined check to handle month 0 (January) correctly
        var currentMonth = state.calendarMonth !== undefined ? state.calendarMonth : today.getMonth();
        var currentYear = state.calendarYear !== undefined ? state.calendarYear : today.getFullYear();
        
        currentMonth = currentMonth - 1;
        if (currentMonth < 0) {
          currentMonth = 11;
          currentYear--;
        }
        
        state.calendarMonth = currentMonth;
        state.calendarYear = currentYear;
        
        // Reset date selection and load available dates for new month
        state.selectedDate = null;
        state.selectedTime = null;
        state.availableSlots = [];
        loadDatesForMonth();
      });
    });

    container.querySelectorAll('[data-action="next-month"]').forEach(function(el) {
      el.addEventListener('click', function() {
        var today = new Date();
        // Use explicit undefined check to handle month 0 (January) correctly
        var currentMonth = state.calendarMonth !== undefined ? state.calendarMonth : today.getMonth();
        var currentYear = state.calendarYear !== undefined ? state.calendarYear : today.getFullYear();
        
        currentMonth = currentMonth + 1;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
        
        state.calendarMonth = currentMonth;
        state.calendarYear = currentYear;
        
        // Reset date selection and load available dates for new month
        state.selectedDate = null;
        state.selectedTime = null;
        state.availableSlots = [];
        loadDatesForMonth();
      });
    });

    // Navigation buttons
    container.querySelectorAll('[data-action="next"]').forEach(function(el) {
      el.addEventListener('click', function() {
        if (state.step === 4) {
          // Validate form
          var name = document.getElementById('frzn-name').value.trim();
          var phone = document.getElementById('frzn-phone').value.trim();
          
          if (!name || name.length < 3) { alert('Unesite ime i prezime (min 3 karaktera)'); return; }
          if (!phone || phone.length < 8) { alert('Unesite validan broj telefona'); return; }
          
          state.guestName = name;
          state.guestPhone = phone;
          state.guestEmail = document.getElementById('frzn-email').value.trim();
          state.guestAddress = ''; // Optional, not collected
          state.guestNotes = document.getElementById('frzn-notes').value.trim();
        }
        
        var previousStep = state.step;
        state.step++;
        
        // When entering step 3 (date/time selection), load available dates
        if (state.step === 3 && previousStep === 2) {
          // Reset calendar to current month
          var today = new Date();
          state.calendarMonth = today.getMonth();
          state.calendarYear = today.getFullYear();
          state.selectedDate = null;
          state.selectedTime = null;
          state.availableSlots = [];
          loadDatesForMonth();
        } else {
          render();
        }
      });
    });

    container.querySelectorAll('[data-action="prev"]').forEach(function(el) {
      el.addEventListener('click', function() {
        var previousStep = state.step;
        state.step--;
        
        // When going back to step 3 (date/time selection), reload available dates
        if (state.step === 3 && previousStep === 4) {
          loadDatesForMonth();
        } else {
          render();
        }
      });
    });

    // Book button
    container.querySelectorAll('[data-action="book"]').forEach(function(el) {
      el.addEventListener('click', function() {
        var btn = this;
        btn.disabled = true;
        btn.textContent = 'Rezervacija...';
        
        var bookingData = {
          salon_id: state.salon.id,
          staff_id: state.selectedStaff.id,
          services: state.selectedServices.map(function(s) { return { id: s.id.toString() }; }),
          date: state.selectedDate,
          time: state.selectedTime,
          guest_name: state.guestName,
          guest_phone: state.guestPhone,
          guest_email: state.guestEmail || '',
          guest_address: state.guestAddress,
          notes: state.guestNotes || ''
        };
        
        createBooking(bookingData)
          .then(function(data) {
            state.step = 6;
            state.bookingSuccess = true;
            render();
          })
          .catch(function(err) {
            console.error('Booking error:', err);
            btn.disabled = false;
            btn.textContent = config.buttonText;
            
            // Handle time slot taken error - redirect to time selection
            if (err.code === 'TIME_SLOT_TAKEN' || err.redirectToTime) {
              alert(err.message || 'Žao nam je, neko se u međuvremenu zakazao u to vrijeme. Molimo odaberite drugo vrijeme.');
              // Reset time selection and reload available slots
              state.selectedTime = null;
              state.availableSlots = [];
              state.step = 3; // Go back to date/time selection
              state.loadingSlots = true;
              render();
              
              // Reload available slots
              var services = state.selectedServices.map(function(s) {
                return { serviceId: s.id.toString(), duration: s.duration };
              });
              loadAvailableSlots(state.selectedStaff.id, state.selectedDate, services)
                .then(function(data) {
                  state.availableSlots = data.slots || [];
                  state.loadingSlots = false;
                  render();
                })
                .catch(function() {
                  state.availableSlots = [];
                  state.loadingSlots = false;
                  render();
                });
            } else {
              alert(err.message || 'Greška pri rezervaciji. Molimo pokušajte ponovo.');
            }
          });
      });
    });
  }

  // Success screen
  function renderWidget() {
    if (state.step === 6 && state.bookingSuccess) {
      return '<div class="frzn-widget">' +
        '<div class="frzn-success">' +
          '<div class="frzn-success-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg></div>' +
          '<h2 style="color:' + (config.theme === 'dark' ? '#fff' : '#333') + ';margin-bottom:8px;">Rezervacija uspješna!</h2>' +
          '<p style="color:' + (config.theme === 'dark' ? '#aaa' : '#666') + ';">Dobićete potvrdu na Email.</p>' +
          '<button class="frzn-btn frzn-btn-primary" style="margin-top:20px;max-width:200px;" onclick="location.reload()">Nova rezervacija</button>' +
        '</div>' +
        '<div class="frzn-powered">Powered by <a href="https://frizerino.com" target="_blank">Frizerino</a></div>' +
      '</div>';
    }
    
    return '<div class="frzn-widget">' +
      '<div class="frzn-body">' +
        renderStep1() +
        renderStep2() +
        renderStep3() +
        renderStep4() +
        renderStep5() +
      '</div>' +
      '<div class="frzn-powered">Powered by <a href="https://frizerino.com" target="_blank">Frizerino</a></div>' +
    '</div>';
  }

  // Track initialization state
  var isInitialized = false;
  var isLoading = false;

  // Initialize with retry and silent error handling
  function init() {
    // Prevent multiple init calls
    if (isInitialized || isLoading) {
      return;
    }
    isLoading = true;

    loadSalonData()
      .then(function(data) {
        // Only update if not already initialized (prevent race conditions)
        if (!isInitialized) {
          isInitialized = true;
          state.salon = data.salon;
          state.services = data.services || [];
          state.staff = data.staff || [];
          state.settings = data.settings || {};
          state.loading = false;
          state.error = null;
          render();
        }
      })
      .catch(function(err) {
        // Only show error if not already initialized
        if (!isInitialized) {
          if (window.console && console.warn) {
            console.warn('Frizerino Widget: Load failed', err.message);
          }
          state.loading = false;
          state.error = 'Widget trenutno nije dostupan. Molimo osvježite stranicu.';
          render();
        }
      })
      .finally(function() {
        isLoading = false;
      });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
