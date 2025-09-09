import './setup';
import { PomodoroSettingTab } from '../src/components/SettingsTab';
import PomodoroPlugin from '../src/main';
import { App, Setting } from 'obsidian';
import { SoundManager } from '../src/logic/soundManager';

// Mock the Setting class
jest.mock('obsidian', () => {
  const original = jest.requireActual('obsidian');

  return {
    ...original,
    Setting: jest.fn().mockImplementation(() => {
      const settingInstance = {
        setName: jest.fn().mockReturnThis(),
        setDesc: jest.fn().mockReturnThis(),
        setHeading: jest.fn().mockReturnThis(),
        settingEl: {
          style: { display: '' }
        },
        addText: jest.fn().mockImplementation(function(this: unknown, cb) {
          const textComponent = {
            setPlaceholder: jest.fn().mockReturnThis(),
            setValue: jest.fn().mockReturnThis(),
            onChange: jest.fn().mockImplementation(onChangeCb => {
              (textComponent as typeof textComponent & { onChangeCallback?: (value: string) => void }).onChangeCallback = onChangeCb;
              return textComponent;
            }),
            onInput: jest.fn().mockReturnThis(),
          };
          cb(textComponent);
          return this;
        }),
        addToggle: jest.fn().mockImplementation(function(this: unknown, cb) {
          const toggleComponent = {
            setValue: jest.fn().mockReturnThis(),
            onChange: jest.fn().mockImplementation(onChangeCb => {
              (toggleComponent as typeof toggleComponent & { onChangeCallback?: (value: boolean) => void }).onChangeCallback = onChangeCb;
              return toggleComponent;
            }),
          };
          cb(toggleComponent);
          return this;
        }),
        addDropdown: jest.fn().mockImplementation(function(this: unknown, cb) {
          const dropdownComponent = {
            addOption: jest.fn().mockReturnThis(),
            setValue: jest.fn().mockReturnThis(),
            onChange: jest.fn().mockImplementation(onChangeCb => {
              (dropdownComponent as typeof dropdownComponent & { onChangeCallback?: (value: string) => void }).onChangeCallback = onChangeCb;
              return dropdownComponent;
            }),
          };
          cb(dropdownComponent);
          return this;
        }),
        addSlider: jest.fn().mockImplementation(function(this: unknown, cb) {
          const sliderComponent = {
            setLimits: jest.fn().mockReturnThis(),
            setValue: jest.fn().mockReturnThis(),
            setDynamicTooltip: jest.fn().mockReturnThis(),
            onChange: jest.fn().mockImplementation(onChangeCb => {
              (sliderComponent as typeof sliderComponent & { onChangeCallback?: (value: number) => void }).onChangeCallback = onChangeCb;
              return sliderComponent;
            }),
          };
          cb(sliderComponent);
          return this;
        }),
        addButton: jest.fn().mockImplementation(function(this: unknown, cb) {
          const buttonComponent = {
            setButtonText: jest.fn().mockReturnThis(),
            onClick: jest.fn().mockImplementation(onClickCb => {
              (buttonComponent as typeof buttonComponent & { onClickCallback?: () => void }).onClickCallback = onClickCb;
              return buttonComponent;
            }),
          };
          cb(buttonComponent);
          return this;
        }),
        onChangeCallback: null,
      };

      // Make all methods reference the same instance for chaining
      Object.values(settingInstance).forEach(method => {
        if (typeof method === 'function' && 'mockReturnThis' in method && typeof method.mockReturnThis === 'function') {
          method.mockReturnValue(settingInstance);
        }
      });

      return settingInstance;
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
    mockPlugin.resetPomodoroSession = jest.fn();

    await mockPlugin.onload();

    mockContainerEl = {
      empty: jest.fn(),
      createEl: jest.fn().mockReturnValue({
        textContent: '',
        innerHTML: '',
      }),
      appendChild: jest.fn(),
    } as unknown as HTMLElement;

    const mockSoundManager = {
      getBuiltInSounds: jest.fn().mockReturnValue(['chime.wav', 'ding.wav']),
      previewSound: jest.fn().mockResolvedValue(undefined),
      updateSettings: jest.fn(),
      cleanup: jest.fn(),
    };

    settingTab = new PomodoroSettingTab(mockApp, mockPlugin, mockSoundManager as unknown as SoundManager);
    settingTab.containerEl = mockContainerEl;
  });

  describe('Display', () => {
    it('should create plugin name header and settings', () => {
      settingTab.display();

      expect(mockContainerEl.empty).toHaveBeenCalled();
      expect(Setting).toHaveBeenCalledTimes(13); // Updated count for new auto-progression setting
    });
  });

  describe('Settings Interactions', () => {
    it('should update workTime on valid input', async () => {
      settingTab.display();
      const settings = (Setting as jest.Mock).mock.results;

      // Simulate text change for work time
      const workTimeSetting = settings[1].value;
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

      const workTimeSetting = settings[1].value;
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

      const shortBreakTimeSetting = settings[2].value;
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

      const longBreakTimeSetting = settings[3].value;
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

      const intervalsSetting = settings[4].value;
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
      expect(mockPlugin.resetPomodoroSession).toHaveBeenCalled();
      expect(mockPlugin.workIntervalCount).toBe(0);
      expect(mockPlugin.currentDurationIndex).toBe(0);
    });

    it('should update showIcon on toggle', async () => {
      settingTab.display();
      const settings = (Setting as jest.Mock).mock.results;

      const showIconSetting = settings[6].value;
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

    it('should update autoProgressEnabled on toggle', async () => {
      settingTab.display();
      const settings = (Setting as jest.Mock).mock.results;

      const autoProgressSetting = settings[5].value;
      const autoProgressOnChange = autoProgressSetting.addToggle.mock.calls[0][0];
      const toggleComponent = {
        setValue: jest.fn(),
        onChange: jest.fn(),
      };
      toggleComponent.setValue = jest.fn().mockReturnValue(toggleComponent);
      toggleComponent.onChange = jest.fn().mockReturnValue(toggleComponent);
      autoProgressOnChange(toggleComponent);
      const onChangeCallback = toggleComponent.onChange.mock.calls[0][0];

      await onChangeCallback(true);

      expect(mockPlugin.settings.autoProgressEnabled).toBe(true);
      expect(mockPlugin.saveSettings).toHaveBeenCalled();
    });
  });

  describe('Input Validation Edge Cases', () => {
    let getOnChangeCallback: (settingIndex: number) => (value: string) => Promise<void>;

    beforeEach(() => {
      settingTab.display();
      getOnChangeCallback = (settingIndex: number) => {
        const settings = (Setting as jest.Mock).mock.results;
        const setting = settings[settingIndex].value;
        const onChangeHandler = setting.addText.mock.calls[0][0];
        const textComponent = {
          setPlaceholder: jest.fn().mockReturnThis(),
          setValue: jest.fn().mockReturnThis(),
          onChange: jest.fn().mockReturnThis(),
          onInput: jest.fn().mockReturnThis(),
        };
        onChangeHandler(textComponent);
        return textComponent.onChange.mock.calls[0][0];
      };
    });

    describe('Work Time Validation', () => {
      it('should not update on zero value', async () => {
        const initialValue = mockPlugin.settings.workTime;
        const onChangeCallback = getOnChangeCallback(1);

        await onChangeCallback('0');

        expect(mockPlugin.settings.workTime).toBe(initialValue);
        expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
      });

      it('should not update on negative value', async () => {
        const initialValue = mockPlugin.settings.workTime;
        const onChangeCallback = getOnChangeCallback(1);

        await onChangeCallback('-5');

        expect(mockPlugin.settings.workTime).toBe(initialValue);
        expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
      });

      it('should not update on decimal value', async () => {
        const initialValue = mockPlugin.settings.workTime;
        const onChangeCallback = getOnChangeCallback(1);

        await onChangeCallback('25.5');

        expect(mockPlugin.settings.workTime).toBe(initialValue);
        expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
      });

      it('should not update on empty string', async () => {
        const initialValue = mockPlugin.settings.workTime;
        const onChangeCallback = getOnChangeCallback(1);

        await onChangeCallback('');

        expect(mockPlugin.settings.workTime).toBe(initialValue);
        expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
      });

      it('should not update on whitespace-only string', async () => {
        const initialValue = mockPlugin.settings.workTime;
        const onChangeCallback = getOnChangeCallback(1);

        await onChangeCallback('   ');

        expect(mockPlugin.settings.workTime).toBe(initialValue);
        expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
      });

      it('should handle value with leading/trailing whitespace', async () => {
        const onChangeCallback = getOnChangeCallback(1);

        await onChangeCallback('  30  ');

        expect(mockPlugin.settings.workTime).toBe(30);
        expect(mockPlugin.saveSettings).toHaveBeenCalled();
      });
    });

    describe('Short Break Time Validation', () => {
      it('should not update on zero value', async () => {
        const initialValue = mockPlugin.settings.shortBreakTime;
        const onChangeCallback = getOnChangeCallback(2);

        await onChangeCallback('0');

        expect(mockPlugin.settings.shortBreakTime).toBe(initialValue);
        expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
      });

      it('should not update on negative value', async () => {
        const initialValue = mockPlugin.settings.shortBreakTime;
        const onChangeCallback = getOnChangeCallback(2);

        await onChangeCallback('-3');

        expect(mockPlugin.settings.shortBreakTime).toBe(initialValue);
        expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
      });

      it('should not update on decimal value', async () => {
        const initialValue = mockPlugin.settings.shortBreakTime;
        const onChangeCallback = getOnChangeCallback(2);

        await onChangeCallback('5.7');

        expect(mockPlugin.settings.shortBreakTime).toBe(initialValue);
        expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
      });
    });

    describe('Long Break Time Validation', () => {
      it('should not update on zero value', async () => {
        const initialValue = mockPlugin.settings.longBreakTime;
        const onChangeCallback = getOnChangeCallback(3);

        await onChangeCallback('0');

        expect(mockPlugin.settings.longBreakTime).toBe(initialValue);
        expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
      });

      it('should not update on negative value', async () => {
        const initialValue = mockPlugin.settings.longBreakTime;
        const onChangeCallback = getOnChangeCallback(3);

        await onChangeCallback('-10');

        expect(mockPlugin.settings.longBreakTime).toBe(initialValue);
        expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
      });

      it('should not update on decimal value', async () => {
        const initialValue = mockPlugin.settings.longBreakTime;
        const onChangeCallback = getOnChangeCallback(3);

        await onChangeCallback('15.3');

        expect(mockPlugin.settings.longBreakTime).toBe(initialValue);
        expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
      });
    });

    describe('Intervals Before Long Break Validation', () => {
      it('should not update on zero value', async () => {
        const initialValue = mockPlugin.settings.intervalsBeforeLongBreak;
        const onChangeCallback = getOnChangeCallback(4);

        await onChangeCallback('0');

        expect(mockPlugin.settings.intervalsBeforeLongBreak).toBe(initialValue);
        expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
      });

      it('should not update on negative value', async () => {
        const initialValue = mockPlugin.settings.intervalsBeforeLongBreak;
        const onChangeCallback = getOnChangeCallback(4);

        await onChangeCallback('-2');

        expect(mockPlugin.settings.intervalsBeforeLongBreak).toBe(initialValue);
        expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
      });

      it('should not update on decimal value', async () => {
        const initialValue = mockPlugin.settings.intervalsBeforeLongBreak;
        const onChangeCallback = getOnChangeCallback(4);

        await onChangeCallback('4.5');

        expect(mockPlugin.settings.intervalsBeforeLongBreak).toBe(initialValue);
        expect(mockPlugin.saveSettings).not.toHaveBeenCalled();
      });
    });
  });
});
