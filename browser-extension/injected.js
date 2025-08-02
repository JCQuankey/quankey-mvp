/**
 * Quankey Browser Extension - Injected Script
 * This script runs in the context of web pages to provide secure auto-fill functionality
 * and quantum-resistant password management.
 */

(function() {
    'use strict';

    // Prevent multiple injections
    if (window.quankeyInjected) {
        return;
    }
    window.quankeyInjected = true;

    console.log('🔐 Quankey injected script loaded');

    // Configuration
    const QUANKEY_CONFIG = {
        version: '1.0.0',
        apiUrl: 'https://api.quankey.xyz',
        features: {
            autoFill: true,
            passwordGeneration: true,
            biometricAuth: true,
            quantumSecurity: true
        }
    };

    /**
     * Quankey Page Interface
     * Provides secure communication between the extension and web pages
     */
    class QuankeyPageInterface {
        constructor() {
            this.isInitialized = false;
            this.passwordFields = new Set();
            this.formData = new Map();
            this.observers = [];
            
            this.init();
        }

        init() {
            this.setupMessageHandling();
            this.scanForPasswordFields();
            this.setupFormObservers();
            this.addQuankeyIndicators();
            this.isInitialized = true;
        }

        /**
         * Set up message handling between injected script and content script
         */
        setupMessageHandling() {
            // Listen for messages from content script
            window.addEventListener('message', (event) => {
                if (event.source !== window || !event.data.type || !event.data.type.startsWith('QUANKEY_')) {
                    return;
                }

                this.handleMessage(event.data);
            }, false);

            // Notify content script that injected script is ready
            window.postMessage({
                type: 'QUANKEY_INJECTED_READY',
                source: 'quankey-injected',
                timestamp: Date.now()
            }, '*');
        }

        /**
         * Handle messages from the content script
         */
        handleMessage(message) {
            switch (message.type) {
                case 'QUANKEY_FILL_PASSWORD':
                    this.fillPassword(message.data);
                    break;
                case 'QUANKEY_FILL_FORM':
                    this.fillForm(message.data);
                    break;
                case 'QUANKEY_GENERATE_PASSWORD':
                    this.generatePassword(message.data);
                    break;
                case 'QUANKEY_SCAN_FIELDS':
                    this.scanForPasswordFields();
                    this.sendFieldsToContentScript();
                    break;
                default:
                    console.log('🔐 Unknown Quankey message type:', message.type);
            }
        }

        /**
         * Scan the page for password and form fields
         */
        scanForPasswordFields() {
            // Clear previous fields
            this.passwordFields.clear();

            // Find password fields
            const passwordInputs = document.querySelectorAll('input[type="password"]');
            const emailInputs = document.querySelectorAll('input[type="email"], input[name*="email"], input[id*="email"]');
            const usernameInputs = document.querySelectorAll('input[name*="username"], input[name*="user"], input[id*="username"], input[id*="user"]');

            // Store field information
            [...passwordInputs, ...emailInputs, ...usernameInputs].forEach(field => {
                const fieldInfo = {
                    element: field,
                    type: this.getFieldType(field),
                    selector: this.generateSelector(field),
                    form: field.closest('form'),
                    isVisible: this.isElementVisible(field)
                };

                this.passwordFields.add(fieldInfo);
                this.addQuankeyIcon(field);
            });
        }

        /**
         * Determine the type of form field
         */
        getFieldType(field) {
            const type = field.type?.toLowerCase();
            const name = field.name?.toLowerCase();
            const id = field.id?.toLowerCase();
            const placeholder = field.placeholder?.toLowerCase();

            if (type === 'password') return 'password';
            if (type === 'email' || name?.includes('email') || id?.includes('email')) return 'email';
            if (name?.includes('username') || name?.includes('user') || id?.includes('username') || id?.includes('user')) return 'username';
            if (placeholder?.includes('password')) return 'password';
            if (placeholder?.includes('email')) return 'email';
            if (placeholder?.includes('username') || placeholder?.includes('user')) return 'username';

            return 'unknown';
        }

        /**
         * Generate a unique selector for an element
         */
        generateSelector(element) {
            if (element.id) return `#${element.id}`;
            if (element.name) return `input[name="${element.name}"]`;
            
            // Generate path-based selector
            const path = [];
            let current = element;
            
            while (current && current !== document.body) {
                let selector = current.tagName.toLowerCase();
                if (current.className) {
                    selector += '.' + current.className.split(' ').join('.');
                }
                path.unshift(selector);
                current = current.parentElement;
            }
            
            return path.join(' > ');
        }

        /**
         * Check if an element is visible
         */
        isElementVisible(element) {
            const style = window.getComputedStyle(element);
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   style.opacity !== '0' &&
                   element.offsetWidth > 0 && 
                   element.offsetHeight > 0;
        }

        /**
         * Add Quankey icon to password fields
         */
        addQuankeyIcon(field) {
            // Prevent duplicate icons
            if (field.dataset.quankeyIconAdded) return;
            field.dataset.quankeyIconAdded = 'true';

            // Create icon container
            const icon = document.createElement('div');
            icon.className = 'quankey-field-icon';
            icon.innerHTML = '🔐';
            icon.style.cssText = `
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 14px;
                cursor: pointer;
                z-index: 10000;
                opacity: 0.7;
                transition: opacity 0.2s;
                pointer-events: auto;
            `;

            // Position relative to field
            const fieldRect = field.getBoundingClientRect();
            if (fieldRect.width > 0 && fieldRect.height > 0) {
                // Make field container relative if needed
                const container = field.parentElement;
                if (window.getComputedStyle(container).position === 'static') {
                    container.style.position = 'relative';
                }

                container.appendChild(icon);

                // Add click handler
                icon.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showQuankeyMenu(field, icon);
                });

                // Hover effects
                icon.addEventListener('mouseenter', () => {
                    icon.style.opacity = '1';
                });
                icon.addEventListener('mouseleave', () => {
                    icon.style.opacity = '0.7';
                });
            }
        }

        /**
         * Show Quankey context menu
         */
        showQuankeyMenu(field, icon) {
            // Remove existing menu
            const existingMenu = document.querySelector('.quankey-context-menu');
            if (existingMenu) {
                existingMenu.remove();
            }

            // Create menu
            const menu = document.createElement('div');
            menu.className = 'quankey-context-menu';
            menu.style.cssText = `
                position: absolute;
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 10001;
                min-width: 200px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
            `;

            // Menu items
            const menuItems = [
                { text: '🔐 Fill with Quankey', action: 'fill' },
                { text: '🎲 Generate Quantum Password', action: 'generate' },
                { text: '💾 Save to Vault', action: 'save' },
                { text: '⚙️ Settings', action: 'settings' }
            ];

            menuItems.forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.textContent = item.text;
                menuItem.style.cssText = `
                    padding: 8px 12px;
                    cursor: pointer;
                    border-bottom: 1px solid #eee;
                `;

                menuItem.addEventListener('mouseenter', () => {
                    menuItem.style.backgroundColor = '#f5f5f5';
                });
                menuItem.addEventListener('mouseleave', () => {
                    menuItem.style.backgroundColor = 'white';
                });

                menuItem.addEventListener('click', () => {
                    this.handleMenuAction(item.action, field);
                    menu.remove();
                });

                menu.appendChild(menuItem);
            });

            // Position menu
            const iconRect = icon.getBoundingClientRect();
            menu.style.left = (iconRect.right + 5) + 'px';
            menu.style.top = iconRect.top + 'px';

            document.body.appendChild(menu);

            // Close menu when clicking outside
            setTimeout(() => {
                document.addEventListener('click', function closeMenu(e) {
                    if (!menu.contains(e.target)) {
                        menu.remove();
                        document.removeEventListener('click', closeMenu);
                    }
                });
            }, 0);
        }

        /**
         * Handle menu actions
         */
        handleMenuAction(action, field) {
            const message = {
                type: 'QUANKEY_ACTION',
                action: action,
                field: {
                    selector: this.generateSelector(field),
                    type: this.getFieldType(field),
                    url: window.location.href,
                    domain: window.location.hostname
                },
                timestamp: Date.now()
            };

            window.postMessage(message, '*');
        }

        /**
         * Fill password field with provided data
         */
        fillPassword(data) {
            const field = document.querySelector(data.selector);
            if (field && data.password) {
                field.value = data.password;
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.dispatchEvent(new Event('change', { bubbles: true }));
                
                console.log('🔐 Password filled by Quankey');
            }
        }

        /**
         * Fill form with multiple field data
         */
        fillForm(data) {
            Object.keys(data.fields).forEach(selector => {
                const field = document.querySelector(selector);
                if (field) {
                    field.value = data.fields[selector];
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
            
            console.log('🔐 Form filled by Quankey');
        }

        /**
         * Generate secure password
         */
        generatePassword(data) {
            // Password will be generated by the extension and sent back
            console.log('🔐 Quantum password generation requested');
        }

        /**
         * Set up mutation observers to watch for dynamic content
         */
        setupFormObservers() {
            const observer = new MutationObserver((mutations) => {
                let shouldRescan = false;
                
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        const hasPasswordFields = Array.from(mutation.addedNodes).some(node => 
                            node.nodeType === Node.ELEMENT_NODE && 
                            (node.querySelector('input[type="password"]') || node.matches('input[type="password"]'))
                        );
                        
                        if (hasPasswordFields) {
                            shouldRescan = true;
                        }
                    }
                });
                
                if (shouldRescan) {
                    setTimeout(() => {
                        this.scanForPasswordFields();
                        this.sendFieldsToContentScript();
                    }, 100);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            this.observers.push(observer);
        }

        /**
         * Send discovered fields to content script
         */
        sendFieldsToContentScript() {
            const fieldData = Array.from(this.passwordFields).map(fieldInfo => ({
                selector: fieldInfo.selector,
                type: fieldInfo.type,
                isVisible: fieldInfo.isVisible,
                hasForm: !!fieldInfo.form
            }));

            window.postMessage({
                type: 'QUANKEY_FIELDS_DISCOVERED',
                fields: fieldData,
                url: window.location.href,
                domain: window.location.hostname,
                timestamp: Date.now()
            }, '*');
        }

        /**
         * Add visual indicators that Quankey is active
         */
        addQuankeyIndicators() {
            // Add CSS for Quankey elements
            if (!document.querySelector('#quankey-styles')) {
                const style = document.createElement('style');
                style.id = 'quankey-styles';
                style.textContent = `
                    .quankey-field-icon {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                    }
                    .quankey-context-menu {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                    }
                    .quankey-protected {
                        box-shadow: 0 0 0 2px rgba(0, 166, 251, 0.3) !important;
                    }
                `;
                document.head.appendChild(style);
            }
        }

        /**
         * Clean up resources
         */
        destroy() {
            this.observers.forEach(observer => observer.disconnect());
            this.observers = [];
            this.passwordFields.clear();
            this.formData.clear();
            
            // Remove Quankey elements
            document.querySelectorAll('.quankey-field-icon, .quankey-context-menu').forEach(el => el.remove());
            
            this.isInitialized = false;
        }
    }

    // Initialize Quankey interface when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.quankeyInterface = new QuankeyPageInterface();
        });
    } else {
        window.quankeyInterface = new QuankeyPageInterface();
    }

    // Expose interface for debugging (development only)
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('dev')) {
        window.quankeyDebug = {
            interface: () => window.quankeyInterface,
            config: QUANKEY_CONFIG,
            version: QUANKEY_CONFIG.version
        };
    }

})();