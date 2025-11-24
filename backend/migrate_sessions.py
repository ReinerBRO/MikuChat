import json
import os
import shutil

def migrate_sessions():
    """Migrate old sessions.json to new user-based format"""
    
    old_file = "sessions.json"
    sessions_dir = "sessions"
    
    # Check if old file exists
    if not os.path.exists(old_file):
        print("No sessions.json found. Nothing to migrate.")
        return
    
    # Create sessions directory if it doesn't exist
    os.makedirs(sessions_dir, exist_ok=True)
    
    # Read old sessions
    try:
        with open(old_file, 'r', encoding='utf-8') as f:
            old_sessions = json.load(f)
        
        if not old_sessions:
            print("sessions.json is empty. Nothing to migrate.")
            return
        
        print(f"Found {len(old_sessions)} sessions in old format.")
        
        # Ask for username
        print("\nPlease enter your username to migrate sessions to:")
        username = input("Username: ").strip()
        
        if not username:
            print("No username provided. Migration cancelled.")
            return
        
        # Sanitize username for filename
        safe_username = "".join(c for c in username if c.isalnum() or c in ('_', '-'))
        new_file = os.path.join(sessions_dir, f"{safe_username}_sessions.json")
        
        # Check if user file already exists
        if os.path.exists(new_file):
            print(f"\nWarning: {new_file} already exists!")
            overwrite = input("Do you want to overwrite it? (y/N): ").strip().lower()
            if overwrite != 'y':
                print("Migration cancelled.")
                return
        
        # Write to new file
        with open(new_file, 'w', encoding='utf-8') as f:
            json.dump(old_sessions, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ Successfully migrated {len(old_sessions)} sessions to {new_file}")
        
        # Backup old file
        backup_file = "sessions.json.backup"
        shutil.copy2(old_file, backup_file)
        print(f"✅ Created backup: {backup_file}")
        
        print("\n🎉 Migration complete!")
        print(f"Your sessions are now available for user: {username}")
        print("\nYou can now:")
        print("1. Refresh your browser")
        print("2. Login with username:", username)
        print("3. Your old chat sessions will appear")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        return

if __name__ == "__main__":
    print("=" * 50)
    print("MikuChat Session Migration Tool")
    print("=" * 50)
    print("\nThis tool will migrate your old sessions.json")
    print("to the new user-based format.\n")
    
    migrate_sessions()
