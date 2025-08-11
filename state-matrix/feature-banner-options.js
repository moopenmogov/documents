/**
 * Feature Banner State Options (State Machine Config)
 * - Single state with two options: Off (default) | On
 * - Anyone can toggle (no permissions)
 * - Server emits SSE notifications for any change
 */

module.exports = {
  key: 'newFeatureBanner',
  description: 'Controls whether the New Features banner/button is shown in UI',
  options: [
    { value: false, label: 'Off', default: true },
    { value: true, label: 'On' }
  ],
  permissions: 'any',
};


