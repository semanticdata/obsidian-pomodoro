
import './setup';
import { PomodoroSettingTab } from '../src/components/SettingsTab';
import PomodoroPlugin from '../src/main';
import { App, Setting } from 'obsidian';
import { PLUGIN_NAME } from '../src/constants';

// Mock the Setting class
jest.mock('obsidian', () => {
  const original = jest.requireActual('obsidian');
  
  return {
    ...original,
    Setting: jest.fn().mockImplementation(() => {
      const setDesc = jest.fn().mockReturnThis();
      const setName = jest.fn().mockReturnThis();
      const addText = jest.fn().mockImplementation(cb => {
        const textComponent = {
          setPlaceholder: jest.fn().mockReturnThis(),
          setValue: jest.fn().mockReturnThis(),
          onChange: jest.fn().mockImplementation(onChangeCb => {
            // Store the callback to be triggered later
            textComponent.onChangeCallback = onChangeCb;
            return textComponent;
          }),
          onInput: jest.fn().mockReturnThis(),
        };
        cb(textComponent);
        return this;
      });
      const addToggle = jest.fn().mockImplementation(cb => {
        const toggleComponent = {
          setValue: jest.fn().mockReturnThis(),
          onChange: jest.fn().mockImplementation(onChangeCb => {
            // Store the callback
            toggleComponent.onChangeCallback = onChangeCb;
            return toggleComponent;
          }),
        };
        cb(toggleComponent);
        return this;
      });

      return {
        setName,
        setDesc,
        addText,
        addToggle,
        onChangeCallback: null, // To store the onChange callback
      };
    }),
  };
});

describe('PomodoroSettingTab', () => {
  let settingTab: PomodoroSettingTab;
  let mockPlugin: PomodoroPlugin;
  let mockApp: App;
  let mockContainerEl: HTMLElement;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockApp = {} as App;
    const manifest = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      minAppVersion: '0.15.0',
      author: 'Test Author',
      description: 'Test Description',
    };

    mockPlugin = new PomodoroPlugin(mockApp, manifest);
    mockPlugin.loadData = jest.fn().mockResolvedValue({});
    mockPlugin.saveData = jest.fn().mockResolvedValue(undefined);
    mockPlugin.saveSettings = jest.fn().mockResolvedValue(undefined);
    mockPlugin.resetTimer = jest.fn();

    await mockPlugin.onload();

    mockContainerEl = {
      empty: jest.fn(),
      createEl: jest.fn().mockReturnValue({
        textContent: '',
        innerHTML: '',
      }),
      appendChild: jest.fn(),
    } as unknown as HTMLElement;

    settingTab = new PomodoroSettingTab(mockApp, mockPlugin);
    settingTab.containerEl = mockContainerEl;
  });

  describe('Display', () => {
    it('should create plugin name header and settings', () => {
      settingTab.display();

      expect(mockContainerEl.empty).toHaveBeenCalled();
      expect(mockContainerEl.createEl).toHaveBeenCalledWith('h1', { text: PLUGIN_NAME });
      expect(Setting).toHaveBeenCalledTimes(5);
    });
  });

  describe('Settings Interactions', () => {
    it('should update workTime on valid input', async () => {
      settingTab.display();
      const settings = (Setting as jest.Mock).mock.results;

      // Simulate text change for work time
      const workTimeSetting = settings[0].value;
      const workTimeOnChange = workTimeSetting.addText.mock.calls[0][0];
      const textComponent = { 
        setPlaceholder: jest.fn(),
        setValue: jest.fn(),
        onChange: jest.fn(),
        onInput: jest.fn(),
      };
      textComponent.setPlaceholder = jest.fn().mockReturnValue(textComponent);
      textComponent.setValue = jest.fn().mockReturnValue(textComponent);
      textComponent.onChange = jest.fn().mockReturnValue(textComponent);
      textComponent.onInput = jest.fn().mockReturnValue(textComponent);
      workTimeOnChange(textComponent);
      const onChangeCallback = textComponent.onChange.mock.calls[0][0];

      await onChangeCallback('30');

      expect(mockPlugin.settings.workTime).toBe(30);
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
      expect(mockPlugin.resetTimer).toHaveBeenCalled();
    });

    it('should not update workTime on invalid input', async () => {
      settingTab.display();
      const settings = (Setting as jest.Mock).mock.results;
      const initialWorkTime = mockPlugin.settings.workTime;

      const workTimeSetting = settings[0].value;
      const workTimeOnChange = workTimeSetting.addText.mock.calls[0][0];
      const textComponent = { 
        setPlaceholder: jest.fn(),
        setValue: jest.fn(),
        onChange: jest.fn(),
        onInput: jest.fn(),
      };
      textComponent.setPlaceholder = jest.fn().mockReturnValue(textComponent);
      textComponent.setValue = jest.fn().mockReturnValue(textComponent);
      textComponent.onChange = jest.fn().mockReturnValue(textComponent);
      textComponent.onInput = jest.fn().mockReturnValue(textComponent);
      workTimeOnChange(textComponent);
      const onChangeCallback = textComponent.onChange.mock.calls[0][0];

      await onChangeCallback('invalid');

      expect(mockPlugin.settings.workTime).toBe(initialWorkTime);
      expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
      expect(mockPlugin.resetTimer).not.toHaveBeenCalled();
    });

    it('should update shortBreakTime on valid input', async () => {
      settingTab.display();
      const settings = (Setting as jest.Mock).mock.results;

      const shortBreakTimeSetting = settings[1].value;
      const shortBreakTimeOnChange = shortBreakTimeSetting.addText.mock.calls[0][0];
      const textComponent = { 
        setPlaceholder: jest.fn(),
        setValue: jest.fn(),
        onChange: jest.fn(),
        onInput: jest.fn(),
      };
      textComponent.setPlaceholder = jest.fn().mockReturnValue(textComponent);
      textComponent.setValue = jest.fn().mockReturnValue(textComponent);
      textComponent.onChange = jest.fn().mockReturnValue(textComponent);
      textComponent.onInput = jest.fn().mockReturnValue(textComponent);
      shortBreakTimeOnChange(textComponent);
      const onChangeCallback = textComponent.onChange.mock.calls[0][0];

      await onChangeCallback('10');

      expect(mockPlugin.settings.shortBreakTime).toBe(10);
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
      expect(mockPlugin.resetTimer).toHaveBeenCalled();
    });

    it('should update longBreakTime on valid input', async () => {
      settingTab.display();
      const settings = (Setting as jest.Mock).mock.results;

      const longBreakTimeSetting = settings[2].value;
      const longBreakTimeOnChange = longBreakTimeSetting.addText.mock.calls[0][0];
      const textComponent = { 
        setPlaceholder: jest.fn(),
        setValue: jest.fn(),
        onChange: jest.fn(),
        onInput: jest.fn(),
      };
      textComponent.setPlaceholder = jest.fn().mockReturnValue(textComponent);
      textComponent.setValue = jest.fn().mockReturnValue(textComponent);
      textComponent.onChange = jest.fn().mockReturnValue(textComponent);
      textComponent.onInput = jest.fn().mockReturnValue(textComponent);
      longBreakTimeOnChange(textComponent);
      const onChangeCallback = textComponent.onChange.mock.calls[0][0];

      await onChangeCallback('20');

      expect(mockPlugin.settings.longBreakTime).toBe(20);
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
      expect(mockPlugin.resetTimer).toHaveBeenCalled();
    });

    it('should update intervalsBeforeLongBreak on valid input', async () => {
      settingTab.display();
      const settings = (Setting as jest.Mock).mock.results;

      const intervalsSetting = settings[3].value;
      const intervalsOnChange = intervalsSetting.addText.mock.calls[0][0];
      const textComponent = { 
        setPlaceholder: jest.fn(),
        setValue: jest.fn(),
        onChange: jest.fn(),
        onInput: jest.fn(),
      };
      textComponent.setPlaceholder = jest.fn().mockReturnValue(textComponent);
      textComponent.setValue = jest.fn().mockReturnValue(textComponent);
      textComponent.onChange = jest.fn().mockReturnValue(textComponent);
      textComponent.onInput = jest.fn().mockReturnValue(textComponent);
      intervalsOnChange(textComponent);
      const onChangeCallback = textComponent.onChange.mock.calls[0][0];

      await onChangeCallback('3');

      expect(mockPlugin.settings.intervalsBeforeLongBreak).toBe(3);
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
      expect(mockPlugin.resetTimer).toHaveBeenCalled();
      expect(mockPlugin.workIntervalCount).toBe(0);
      expect(mockPlugin.currentDurationIndex).toBe(0);
    });

    it('should update showIcon on toggle', async () => {
      settingTab.display();
      const settings = (Setting as jest.Mock).mock.results;

      const showIconSetting = settings[4].value;
      const showIconOnChange = showIconSetting.addToggle.mock.calls[0][0];
      const toggleComponent = { 
        setValue: jest.fn(),
        onChange: jest.fn(),
      };
      toggleComponent.setValue = jest.fn().mockReturnValue(toggleComponent);
      toggleComponent.onChange = jest.fn().mockReturnValue(toggleComponent);
      showIconOnChange(toggleComponent);
      const onChangeCallback = toggleComponent.onChange.mock.calls[0][0];

      await onChangeCallback(true);

      expect(mockPlugin.settings.showIcon).toBe(true);
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
    });
  });
});
