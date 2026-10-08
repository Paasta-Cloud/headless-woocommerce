export function ContentBody({blocks=[]}){return <div className="content-prose">{blocks.map((b,i)=>{const Tag=['h2','h3'].includes(b.type)?b.type:'p';return <Tag key={i}>{b.text}</Tag>;})}</div>;}
