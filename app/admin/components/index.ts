// Главный файл экспорта компонентов админ-панели
// Все компоненты организованы по папкам для удобства

// Тикеты (старые)
export { UserProfileModal as TicketsUserProfileModal } from './tickets';
export { ReleaseInfoModal as TicketsReleaseInfoModal } from './tickets';
export { TicketListItem, UserRoleBadge } from './tickets';
export { TicketDetailHeader } from './tickets';
export { TicketMessages as TicketsMessages } from './tickets';
export { TicketsTab } from './tickets';

// Живые тикеты (реалтайм)
export { TicketFilters } from './tickets-live';
export { TicketList } from './tickets-live';
export { ChatMessages } from './tickets-live';
export { ChatHeader } from './tickets-live';
export { ChatInput } from './tickets-live';
export { TicketsTabLive } from './tickets-live';

// Пользователи
export { UserCard } from './users';
export { UserFilters } from './users';
export { RoleStats } from './users';
export { UserListItem } from './users';
export { UserList } from './users';
export { UserProfileModal } from './users';
export { TransactionList } from './users';

// Релизы
export { ReleaseCard } from './releases';
export { ReleasesFilters } from './releases';

// Новости
export { default as NewsTab } from './news/NewsTab';
export { NewsNotifications } from './news/NewsNotifications';

// Выплаты
export { default as PayoutsTab } from './payouts/PayoutsTab';

// Демо
export { default as DemosTab } from './demos/DemosTab';

// Выводы
export { default as WithdrawalsTab } from './withdrawals/WithdrawalsTab';

// Архив
export { default as ArchiveTab } from './archive/ArchiveTab';

// Контракты
export { default as ContractsTab } from './contracts/ContractsTab';

// Большие компоненты - оставлены в корне (ожидают разбивки)
export { default as AdminTicketsPanel } from './AdminTicketsPanel';
export { default as ReleasesModeration } from './ReleasesModeration';
export { default as UsersTab } from './UsersTab';
