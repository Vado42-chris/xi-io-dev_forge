/**
 * Example Plugin Template
 * 
 * This is a template for creating Dev Forge plugins.
 */

class MyPlugin {
  constructor() {
    this.id = 'my-plugin';
    this.name = 'My Plugin';
    this.version = '1.0.0';
    this.apiVersion = '1.0.0';
    this.manifest = require('./plugin.json');
  }

  /**
   * Activate plugin
   */
  async activate(context) {
    // Register model provider
    context.devForge.models.registerProvider({
      id: 'my-model',
      name: 'My Custom Model',
      type: 'plugin',
      enabled: true,
      initialize: async () => {},
      listModels: async () => [],
      getModel: async (id) => null,
      isModelAvailable: async (id) => false,
      generate: async (request) => {
        return {
          response: 'Response from my model',
          model: request.modelId || 'my-model',
          provider: 'plugin',
          success: true
        };
      },
      getHealth: async () => ({
        isHealthy: true,
        message: 'OK'
      }),
      isAvailable: async () => true
    });

    // Register command
    context.devForge.commands.register({
      id: 'myPlugin.doSomething',
      title: 'Do Something',
      handler: async () => {
        context.devForge.logger.info('Doing something...');
        return 'Done!';
      }
    });

    // Register event handler
    context.devForge.events.on('modelExecution', (event) => {
      context.devForge.logger.info(`Model executed: ${event.modelId}`);
    });
  }

  /**
   * Deactivate plugin
   */
  async deactivate() {
    // Cleanup if needed
  }
}

module.exports = new MyPlugin();

