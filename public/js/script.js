(function() {
  'use strict';
  window.addEventListener('load', function() {
    const forms = document.getElementsByClassName('needs-validation');
    var validation = Array.prototype.filter.call(forms, function(form) {
      form.addEventListener('submit', function(event) {
        if (form.checkValidity() === false) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add('was-validated');
      }, false);
    });

    const gstToggle = document.getElementById('gstToggle');
    const listingPriceWraps = document.querySelectorAll('.listing-price-wrap');

    if (gstToggle && listingPriceWraps.length) {
      const updateTaxDisplay = () => {
        listingPriceWraps.forEach((priceWrap) => {
          priceWrap.classList.toggle('tax-enabled', gstToggle.checked);
        });
      };

      gstToggle.addEventListener('change', updateTaxDisplay);
      updateTaxDisplay();
    }

    const searchInput = document.getElementById('global-search-input');
    const suggestionBox = document.getElementById('search-suggestions');

    if (searchInput && suggestionBox) {
      const renderSuggestions = (items) => {
        if (!items || items.length === 0) {
          suggestionBox.classList.remove('show');
          suggestionBox.innerHTML = '<div class="search-suggestion-empty">No matching destinations</div>';
          return;
        }

        suggestionBox.classList.add('show');
        suggestionBox.innerHTML = items.map((item) => `
          <div class="search-suggestion-item" data-id="${item._id}">
            ${item.image ? `<img class="search-suggestion-thumb" src="${item.image}" alt="">` : `<span class="search-suggestion-thumb" aria-hidden="true"></span>`}
            <div>
              <div class="search-suggestion-title">${item.title}</div>
              <div class="search-suggestion-location">${item.location || ''}${item.location && item.country ? ', ' : ''}${item.country || ''}</div>
            </div>
          </div>
        `).join('');

        suggestionBox.querySelectorAll('[data-id]').forEach((row) => {
          row.addEventListener('click', () => {
            const listingId = row.dataset.id;
            if (listingId) {
              window.location.href = `/listings/${listingId}`;
            }
          });
        });
      };

      let searchTimer;
      searchInput.addEventListener('input', () => {
        const value = searchInput.value.trim();

        if (!value) {
          suggestionBox.classList.remove('show');
          suggestionBox.innerHTML = '<div class="search-suggestion-empty">Start typing a destination</div>';
          return;
        }

        window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(() => {
          fetch(`/listings/search?search=${encodeURIComponent(value)}&limit=6`)
            .then((res) => res.json())
            .then((payload) => {
              if (payload && Array.isArray(payload.suggestions)) {
                renderSuggestions(payload.suggestions);
              }
            })
            .catch(() => {
              suggestionBox.classList.remove('show');
            });
        }, 180);
      });

      document.addEventListener('click', (event) => {
        if (!event.target.closest('.search-input-wrap')) {
          suggestionBox.classList.remove('show');
        }
      });
    }

  }, false);
})();