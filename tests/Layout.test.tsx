
import React from 'react';
import Layout from '@/app/layout';

describe('Layout', () => {
  it('wraps its children in the document shell', () => {
    const child = <div>children</div>;
    const document = Layout({ children: child });

    expect(document.type).toBe('html');
    expect(document.props.children.type).toBe('body');
    expect(document.props.children.props.children.props.children.props.children).toEqual(child);
  });
});
