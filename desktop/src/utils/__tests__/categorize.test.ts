import { describe, it, expect } from 'vitest';
import { categorizeApp, isSystemApp, findAppGroup } from '../categorize';

describe('categorizeApp', () => {
  it('categorizes Chrome as browser', () => {
    const result = categorizeApp('Google Chrome');
    expect(result.category).toBe('浏览器');
  });

  it('categorizes Firefox as browser', () => {
    const result = categorizeApp('Mozilla Firefox');
    expect(result.category).toBe('浏览器');
  });

  it('categorizes Visual Studio Code as dev tool', () => {
    const result = categorizeApp('Visual Studio Code');
    expect(result.category).toBe('开发工具');
  });

  it('categorizes Python as runtime', () => {
    const result = categorizeApp('Python 3.12.0');
    expect(result.category).toBe('运行时');
  });

  it('categorizes MySQL Workbench as database', () => {
    const result = categorizeApp('MySQL Workbench');
    expect(result.category).toBe('数据库');
  });

  it('categorizes Photoshop as design tool', () => {
    const result = categorizeApp('Adobe Photoshop');
    expect(result.category).toBe('设计工具');
  });

  it('categorizes WeChat as communication', () => {
    const result = categorizeApp('WeChat');
    expect(result.category).toBe('通讯工具');
  });

  it('categorizes Steam as game', () => {
    const result = categorizeApp('Steam');
    expect(result.category).toBe('游戏');
  });

  it('categorizes unknown app as other', () => {
    const result = categorizeApp('SomeRandomApp 1.0');
    expect(result.category).toBe('其他');
  });

  it('is case insensitive', () => {
    const result = categorizeApp('google chrome');
    expect(result.category).toBe('浏览器');
  });
});

describe('isSystemApp', () => {
  it('detects VC++ redistributable as system', () => {
    expect(isSystemApp('Microsoft Visual C++ 2015-2022 Redistributable')).toBe(true);
  });

  it('detects .NET runtime as system', () => {
    expect(isSystemApp('.NET Runtime 8.0.0')).toBe(true);
  });

  it('does not flag Chrome as system', () => {
    expect(isSystemApp('Google Chrome')).toBe(false);
  });

  it('does not flag VS Code as system', () => {
    expect(isSystemApp('Visual Studio Code')).toBe(false);
  });

  it('detects Intel driver as system', () => {
    expect(isSystemApp('Intel(R) Graphics Driver')).toBe(true);
  });
});

describe('findAppGroup', () => {
  it('finds Office sub-components', () => {
    const result = findAppGroup('Office 16 Click-to-Run Extensibility');
    expect(result).toBeTruthy();
    expect(result!.parentName).toBe('Microsoft Office');
    expect(result!.category).toBe('办公软件');
  });

  it('finds NVIDIA sub-components', () => {
    const result = findAppGroup('NVIDIA App 1.0');
    expect(result).toBeTruthy();
    expect(result!.parentName).toBe('NVIDIA 驱动');
  });

  it('returns undefined for unrelated apps', () => {
    const result = findAppGroup('Google Chrome');
    expect(result).toBeUndefined();
  });
});
