import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolName: string;
  onActivate: (plan: string) => void;
}

const plans = [
  { id: 'free_trial', name: 'Free Trial', price: '$0', desc: '14 days, all features' },
  { id: 'basic', name: 'Basic', price: '$10/mo', desc: '1 tool, basic features' },
  { id: 'growth', name: 'Growth', price: '$19/mo', desc: '3 tools, enhanced' },
  { id: 'pro', name: 'Pro', price: '$49/mo', desc: 'All tools, priority' },
];

export const ActivationModal: React.FC<ActivationModalProps> = ({ isOpen, onClose, toolName, onActivate }) => {
  const [selected, setSelected] = React.useState('free_trial');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Activate ${toolName}`}>
      <div className="space-y-3">
        <p className="text-sm text-gray-500">Choose a plan to get started:</p>
        {plans.map((plan) => (
          <label
            key={plan.id}
            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
              selected === plan.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="plan"
                checked={selected === plan.id}
                onChange={() => setSelected(plan.id)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-800">{plan.name}</div>
                <div className="text-xs text-gray-500">{plan.desc}</div>
              </div>
            </div>
            <span className="font-bold text-gray-800">{plan.price}</span>
          </label>
        ))}
        <Button fullWidth onClick={() => onActivate(selected)} className="mt-4">
          Activate Tool
        </Button>
      </div>
    </Modal>
  );
};
