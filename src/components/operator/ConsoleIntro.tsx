import React from 'react';
type ConsoleIcon = React.ComponentType<{size?: number}>;
export function ConsoleIntro({icon: Icon, title, description, eyebrow, stats = []}: {icon: ConsoleIcon; title: string; description: string; eyebrow?: string; stats?: {label: string; value: React.ReactNode}[]}) {
  return <header className="console-intro"><div className="console-intro-main"><span className="console-emblem" aria-hidden="true"><Icon size={26}/></span><div>{eyebrow && <span className="console-kicker">{eyebrow}</span>}<h2>{title}</h2><p>{description}</p></div></div>{stats.length > 0 && <dl className="console-facts">{stats.map(stat => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}</dl>}</header>;
}
export function ConsoleGroupTitle({icon: Icon, title, description, badge}: {icon: ConsoleIcon; title: string; description: string; badge?: string}) {
  return <><span className="console-group-icon" aria-hidden="true"><Icon size={21}/></span><span className="console-group-copy"><strong>{title}</strong><small>{description}</small></span>{badge && <span className="console-group-badge">{badge}</span>}</>;
}
