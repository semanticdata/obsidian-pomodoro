import './setup';
import PomodoroPlugin from '../src/main';
import { App } from 'obsidian';
import { PluginWithPrivates } from './setup';

describe('Settings Management', () => {
  let plugin: PomodoroPlugin;
  let mockApp: App;

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();

    mockApp = {} as App; // Minimal App mock
    const manifest = { id: 'test-plugin', name: 'Test Plugin', version: '1.0.0', minAppVersion: '0.15.0', author: 'Test Author', description: 'Test Description' };

    plugin = new PomodoroPlugin(mockApp, manifest);

    plugin.loadData = jest.fn().mockResolvedValue({});
    plugin.saveData = jest.fn().mockResolvedValue(undefined);

    await plugin.onload();
  });

  afterEach(async () => {
    // Ensure plugin is unloaded if onload was called
    if (plugin.onunload) {
      await plugin.onunload();
    }
  });

  it('should save settings', async () => {
    plugin.settings.workTime = 30;
    await plugin.saveSettings();
    expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
  });

  it('should update timer settings when settings change', async () => {
    const timer = (plugin as PluginWithPrivates)._timer;
    const updateSettingsSpy = jest.spyOn(timer, 'updateSettings');

    plugin.settings.workTime = 45;
    await plugin.saveSettings();

    expect(updateSettingsSpy).toHaveBeenCalledWith(plugin.settings);
  });
});