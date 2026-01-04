/**
 * 解析 UTC 时间字符串为 Date 对象
 * 后端返回的时间是 UTC 时间，但可能没有带 Z 后缀
 * 此函数确保正确解析为 UTC 时间
 */
export function parseUTCDate(date: Date | string | number): Date {
    if (date instanceof Date) {
        return date;
    }
    if (typeof date === 'number') {
        return new Date(date);
    }
    // 字符串处理：如果没有时区信息，添加 Z 后缀表示 UTC
    const dateStr = date.trim();
    if (dateStr.endsWith('Z') || dateStr.includes('+') || dateStr.includes('-', 10)) {
        // 已有时区信息，直接解析
        return new Date(dateStr);
    }
    // 没有时区信息，默认视为 UTC
    return new Date(`${dateStr}Z`);
}

/**
 * 格式化为相对时间（如"3分钟前"）
 * 自动处理 UTC 时间转换
 */
export function formatTimeAgo(date: Date | string | number): string {
    const now = new Date();
    const past = parseUTCDate(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return '刚刚';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}分钟前`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}小时前`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `${diffInDays}天前`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths}个月前`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}年前`;
}

/**
 * 格式化为本地日期时间字符串
 * 自动处理 UTC 时间转换
 */
export function formatDateTime(
    date: Date | string | number,
    options?: {
        showTime?: boolean;
        showSeconds?: boolean;
    }
): string {
    const d = parseUTCDate(date);
    const { showTime = true, showSeconds = false } = options || {};

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    if (!showTime) {
        return `${year}-${month}-${day}`;
    }

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    if (showSeconds) {
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}
