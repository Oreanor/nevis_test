/** Small non-uniform tree shared by the tree-table tests. */
export interface TestNode {
  id: string;
  name: string;
  value: number;
  children?: TestNode[];
}

export const testTree: TestNode[] = [
  {
    id: 'root',
    name: 'Root',
    value: 100,
    children: [
      {
        id: 'a',
        name: 'Branch A',
        value: 60,
        children: [
          { id: 'a1', name: 'Leaf A1', value: 40, children: [{ id: 'a1x', name: 'Deep A1X', value: 40 }] },
          { id: 'a2', name: 'Leaf A2', value: 20 },
        ],
      },
      { id: 'b', name: 'Branch B', value: 40 },
    ],
  },
];

export const testAccessors = {
  getRowId: (node: TestNode) => node.id,
  getSubRows: (node: TestNode) => node.children,
};
