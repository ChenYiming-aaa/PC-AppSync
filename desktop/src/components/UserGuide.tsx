import { X, Package, Cpu, CheckCircle, HelpCircle, Download, RefreshCw, Scan, Search } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export function UserGuide({ onClose }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.4)',
    }} onClick={onClose}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
      <div style={{
        background: 'var(--md-surface)',
        borderRadius: 24,
        width: '92%', maxWidth: 640,
        maxHeight: '85vh', overflow: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        animation: 'slideUp 0.2s cubic-bezier(0.2, 0, 0, 1)',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--md-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--md-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--md-on-surface)', lineHeight: 1.3 }}>使用指南</h2>
              <span style={{ fontSize: 13, color: 'var(--md-on-surface-variant)' }}>快速上手 AppSync</span>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--md-outline-variant)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--md-on-surface-variant)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          <Section icon={Scan} color="var(--md-primary)" title="1. 扫描电脑">
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--md-on-surface-variant)' }}>
              点击「<strong>开始扫描</strong>」按钮，AppSync 会自动检测你电脑上安装的软件、运行时环境和包管理器（pip / npm）。扫描结果会自动上传到云端，方便你在新电脑上查看。
            </p>
          </Section>

          <Section icon={Package} color="var(--md-primary)" title="2. 统计卡片说明">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <StatItem icon={Package} color="var(--md-primary)" label="Applications" desc="本机检测到的应用总数（不含系统组件）" />
              <StatItem icon={Cpu} color="var(--md-tertiary)" label="Scan Time" desc="本次扫描耗时，自动精确测量" />
              <StatItem icon={CheckCircle} color="#1D6F42" label="Matched" desc="已匹配到官方下载链接的应用数量" />
              <StatItem icon={HelpCircle} color="var(--md-error)" label="Unmatched" desc="未匹配到下载链接的应用，可手动搜索或提交链接" />
            </div>
          </Section>

          <Section icon={RefreshCw} color="#00695C" title="3. 跨设备对比">
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--md-on-surface-variant)' }}>
              在 <strong>Downloads</strong> 页面选择旧电脑的扫描记录，系统会自动对比两台电脑的软件差异，
              列出「旧电脑有、新电脑没有」的应用，帮你快速定位需要安装的软件。
            </p>
          </Section>

          <Section icon={Download} color="#6A1B9A" title="4. 下载链接库">
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--md-on-surface-variant)' }}>
              AppSync 内置了 <strong>200+</strong> 条常用软件的官方下载链接。在 Downloads 页面点击「<strong>Link Library</strong>」浏览全部链接，
              支持搜索和分类筛选。你可以直接打开下载页或复制链接。如果某个软件没有内置链接，你可以手动提交，管理员审核后即可生效。
            </p>
          </Section>

          <Section icon={Search} color="#E65100" title="5. 提交社区链接">
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--md-on-surface-variant)' }}>
              在 Software List 或 Downloads 页面中，未匹配的应用下方会显示「<strong>+ Submit official link</strong>」按钮，
              点击后粘贴官方下载地址提交。管理员审核通过后，该链接会出现在所有用户的链接库中。
            </p>
          </Section>

        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, color, title, children }: { icon: any; color: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color={color} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--md-on-surface)' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function StatItem({ icon: Icon, color, label, desc }: { icon: any; color: string; label: string; desc: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 8, background: 'var(--md-surface-container)' }}>
      <Icon size={14} color={color} />
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--md-on-surface)', minWidth: 80 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--md-on-surface-variant)', lineHeight: 1.4 }}>{desc}</span>
    </div>
  );
}
