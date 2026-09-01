import { GraduationCap, BookOpen } from 'lucide-react';
import './RoleSelector.css';

export default function RoleSelector({ selectedRole, onRoleChange }) {
  return (
    <div className="role-selector-container">
      <div className="role-selector" role="tablist" aria-label="Select user role">
        <button
          type="button"
          role="tab"
          aria-selected={selectedRole === 'tutor'}
          className={`role-button ${selectedRole === 'tutor' ? 'role-button-active' : ''}`}
          onClick={() => onRoleChange('tutor')}
        >
          <GraduationCap size={18} className="role-icon" />
          <span className="role-text">Tutor</span>
          {selectedRole === 'tutor' && <span className="role-badge">Active</span>}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={selectedRole === 'student'}
          className={`role-button ${selectedRole === 'student' ? 'role-button-active' : ''}`}
          onClick={() => onRoleChange('student')}
        >
          <BookOpen size={18} className="role-icon" />
          <span className="role-text">Student</span>
          {selectedRole === 'student' && <span className="role-badge">Active</span>}
        </button>
      </div>
    </div>
  );
}
