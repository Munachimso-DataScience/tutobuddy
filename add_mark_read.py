import sys
import re

file_path = 'frontend/src/app/dashboard/layout.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Check, CheckCircle2 to lucide imports
import_regex = r'(    BarChart3,\n    Camera\n)'
import_replacement = r'\1,\n    Check,\n    CheckCircle2'
content = re.sub(import_regex, import_replacement, content)

# 2. Update handleNotificationClick
handle_regex = r'(    const handleNotificationClick = async \(notification: NotificationItem\) => \{\n        try \{\n            const jwt = await getCachedJWT\(\);\n            await axios\.patch\(`\$\{API_URL\}/api/notifications/\$\{notification\.\$id\}/read`, \{\}, \{\n                headers: \{ Authorization: `Bearer \$\{jwt\}` \}\n            \}\);\n        \} catch \{\n            // ignore read errors\n        \}\n    \};)'

handle_replacement = r'''    const handleNotificationClick = async (notification: NotificationItem, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        if (notification.is_read) return;

        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => 
                n.$id === notification.$id ? { ...n, is_read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));

            const jwt = await getCachedJWT();
            await axios.patch(`${API_URL}/api/notifications/${notification.$id}/read`, {}, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
        } catch {
            fetchNotifications(); // revert on failure
        }
    };

    const handleMarkAllRead = async () => {
        const unread = notifications.filter(n => !n.is_read);
        if (unread.length === 0) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);

        try {
            const jwt = await getCachedJWT();
            await Promise.all(
                unread.map(n => 
                    axios.patch(`${API_URL}/api/notifications/${n.$id}/read`, {}, {
                        headers: { Authorization: `Bearer ${jwt}` }
                    })
                )
            );
        } catch {
            fetchNotifications(); // revert on failure
        }
    };'''
content = re.sub(handle_regex, handle_replacement, content)


# 3. Add 'Mark all as read' to header
header_regex = r'(<p className="text-xs text-foreground/50 dark:text-cream/50">Your study reminders, reports, and course alerts</p>\n                                        </div>)'
header_replacement = r'''\1
                                        {unreadCount > 0 && (
                                            <button 
                                                onClick={handleMarkAllRead}
                                                className="absolute bottom-3 right-4 text-[10px] font-bold text-secondary hover:text-secondary/80 flex items-center gap-1"
                                            >
                                                <CheckCircle2 className="h-3 w-3" /> Mark all read
                                            </button>
                                        )}'''
content = re.sub(header_regex, header_replacement, content)


# 4. Add the Mark as Read button to each item
item_regex = r'(!item\.is_read && \(\n\s*)<span className="mt-1 h-2\.5 w-2\.5 rounded-full bg-secondary flex-shrink-0" />(\n\s*\))'
item_replacement = r'''\1<div className="flex flex-col items-center gap-2">
                                                                <span className="h-2.5 w-2.5 rounded-full bg-secondary flex-shrink-0" />
                                                                <button 
                                                                    onClick={(e) => handleNotificationClick(item, e)}
                                                                    className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                                                                    title="Mark as read"
                                                                >
                                                                    <Check className="h-3 w-3 text-secondary" />
                                                                </button>
                                                            </div>\2'''
content = re.sub(item_regex, item_replacement, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated frontend/src/app/dashboard/layout.tsx")
