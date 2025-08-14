# Система отзывов - Table Schema и RLS

## Table Schema - `product_reviews`

```sql
create table public.product_reviews (
  id uuid not null default gen_random_uuid (),
  product_id uuid null,
  user_id uuid null,
  rating integer null,
  text text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_verified_purchase boolean null default false,
  helpful_count integer null default 0,
  total_likes integer null default 0,
  total_dislikes integer null default 0,
  constraint product_reviews_pkey primary key (id),
  constraint product_reviews_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint product_reviews_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint product_reviews_rating_check check (
    (
      (rating >= 1)
      and (rating <= 5)
    )
  )
) TABLESPACE pg_default;
```

## Индексы

```sql
create index IF not exists idx_product_reviews_product_id on public.product_reviews using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_product_reviews_user_id on public.product_reviews using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_product_reviews_created_at on public.product_reviews using btree (created_at desc) TABLESPACE pg_default;
```

## RLS Политики

### SELECT
- **Reviews are viewable by everyone**
- Applied to: public role

### INSERT  
- **Users can create reviews**
- Applied to: public role

### DELETE
- **Users can delete own reviews**
- Applied to: public role

### UPDATE
- **Users can update own reviews**
- Applied to: public role

## Структура полей

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | uuid | Уникальный идентификатор | Primary Key, auto-generated |
| `product_id` | uuid | ID товара | Foreign Key → products(id), CASCADE |
| `user_id` | uuid | ID пользователя | Foreign Key → profiles(id), CASCADE |
| `rating` | integer | Рейтинг | 1-5, NOT NULL |
| `text` | text | Текст отзыва | NULL |
| `created_at` | timestamp | Дата создания | auto now() |
| `updated_at` | timestamp | Дата обновления | auto now() |
| `is_verified_purchase` | boolean | Подтвержденная покупка | default false |
| `helpful_count` | integer | Количество "полезно" | default 0 |
| `total_likes` | integer | Общее количество лайков | default 0 |
| `total_dislikes` | integer | Общее количество дизлайков | default 0 |

## Особенности

- **CASCADE удаление** при удалении товара или пользователя
- **Проверка рейтинга** от 1 до 5
- **Автоматические временные метки**
- **Индексы для оптимизации** запросов по product_id, user_id и created_at
- **RLS политики** для безопасного доступа к данным

---

# Система комментариев к отзывам - Table Schema и RLS

## Table Schema - `review_comments`

```sql
create table public.review_comments (
  id uuid not null default gen_random_uuid (),
  review_id uuid null,
  user_id uuid null,
  text text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  parent_comment_id uuid null,
  reply_count integer null default 0,
  constraint review_comments_pkey primary key (id),
  constraint review_comments_parent_comment_id_fkey foreign KEY (parent_comment_id) references review_comments (id) on delete CASCADE,
  constraint review_comments_review_id_fkey foreign KEY (review_id) references product_reviews (id) on delete CASCADE,
  constraint review_comments_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;
```

## Индексы для комментариев

```sql
create index IF not exists idx_review_comments_review_id on public.review_comments using btree (review_id) TABLESPACE pg_default;

create index IF not exists idx_review_comments_parent_id on public.review_comments using btree (parent_comment_id) TABLESPACE pg_default;
```

## RLS Политики для комментариев

### SELECT
- **Comments are viewable by everyone**
- Applied to: public role

### INSERT  
- **Users can create comments**
- Applied to: public role

### DELETE
- **Users can delete own comments**
- Applied to: public role

### UPDATE
- **Users can update own comments**
- Applied to: public role

## Структура полей комментариев

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | uuid | Уникальный идентификатор | Primary Key, auto-generated |
| `review_id` | uuid | ID отзыва | Foreign Key → product_reviews(id), CASCADE |
| `user_id` | uuid | ID пользователя | Foreign Key → profiles(id), CASCADE |
| `text` | text | Текст комментария | NOT NULL |
| `created_at` | timestamp | Дата создания | auto now() |
| `updated_at` | timestamp | Дата обновления | auto now() |
| `parent_comment_id` | uuid | ID родительского комментария | Foreign Key → review_comments(id), CASCADE |
| `reply_count` | integer | Количество ответов | default 0 |

## Особенности комментариев

- **Иерархическая структура** - поддержка вложенных комментариев (ответы на комментарии)
- **CASCADE удаление** при удалении отзыва, пользователя или родительского комментария
- **Автоматические временные метки**
- **Индексы для оптимизации** запросов по review_id и parent_comment_id
- **RLS политики** для безопасного доступа к данным
- **Подсчет ответов** для отображения количества ответов на комментарий

---

# Система медиа для отзывов - Table Schema и RLS

## Table Schema - `review_media`

```sql
create table public.review_media (
  id uuid not null default gen_random_uuid (),
  review_id uuid null,
  media_type text null,
  media_url text not null,
  thumbnail_url text null,
  storage_path text not null,
  file_size integer null,
  duration_ms integer null,
  width integer null,
  height integer null,
  created_at timestamp with time zone null default now(),
  order_index integer null default 0,
  constraint review_media_pkey primary key (id),
  constraint review_media_review_id_fkey foreign KEY (review_id) references product_reviews (id) on delete CASCADE,
  constraint review_media_media_type_check check (
    (
      media_type = any (array['image'::text, 'video'::text])
    )
  )
) TABLESPACE pg_default;
```

## Индексы для медиа

```sql
create index IF not exists idx_review_media_review_id on public.review_media using btree (review_id) TABLESPACE pg_default;
```

## RLS Политики для медиа

### SELECT
- **Review media is viewable by everyone**
- Applied to: public role

### INSERT  
- **Review authors can upload media**
- Applied to: public role

### DELETE
- **Review authors can delete media**
- Applied to: public role

## Структура полей медиа

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | uuid | Уникальный идентификатор | Primary Key, auto-generated |
| `review_id` | uuid | ID отзыва | Foreign Key → product_reviews(id), CASCADE |
| `media_type` | text | Тип медиа | 'image' или 'video' |
| `media_url` | text | URL медиа файла | NOT NULL |
| `thumbnail_url` | text | URL превью | NULL |
| `storage_path` | text | Путь в хранилище | NOT NULL |
| `file_size` | integer | Размер файла в байтах | NULL |
| `duration_ms` | integer | Длительность видео в мс | NULL |
| `width` | integer | Ширина медиа | NULL |
| `height` | integer | Высота медиа | NULL |
| `created_at` | timestamp | Дата создания | auto now() |
| `order_index` | integer | Порядок отображения | default 0 |

## Особенности медиа

- **Поддержка изображений и видео** - ограничение по типу медиа
- **CASCADE удаление** при удалении отзыва
- **Метаданные файлов** - размер, длительность, размеры
- **Превью изображения** - для видео файлов
- **Порядок отображения** - для галереи медиа
- **Хранение в облаке** - storage_path для интеграции с Supabase Storage
- **RLS политики** - только авторы отзывов могут управлять медиа

---

# Система реакций на отзывы - Table Schema и RLS

## Table Schema - `review_reactions`

```sql
create table public.review_reactions (
  id uuid not null default gen_random_uuid (),
  review_id uuid null,
  user_id uuid null,
  reaction_type text null,
  created_at timestamp with time zone null default now(),
  constraint review_reactions_pkey primary key (id),
  constraint review_reactions_review_id_user_id_key unique (review_id, user_id),
  constraint review_reactions_review_id_fkey foreign KEY (review_id) references product_reviews (id) on delete CASCADE,
  constraint review_reactions_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint review_reactions_reaction_type_check check (
    (
      reaction_type = any (array['like'::text, 'dislike'::text])
    )
  )
) TABLESPACE pg_default;
```

## Индексы для реакций

```sql
create index IF not exists idx_review_reactions_review_id on public.review_reactions using btree (review_id) TABLESPACE pg_default;

create index IF not exists idx_review_reactions_user_id on public.review_reactions using btree (user_id) TABLESPACE pg_default;
```

## Триггер для обновления счетчиков

```sql
create trigger trigger_update_review_reaction_counts
after INSERT
or DELETE
or
update on review_reactions for EACH row
execute FUNCTION update_review_reaction_counts ();
```

## RLS Политики для реакций

### SELECT
- **Reactions are viewable by everyone**
- Applied to: public role

### INSERT  
- **Users can create reactions**
- Applied to: public role

### DELETE
- **Users can delete own reactions**
- Applied to: public role

### UPDATE
- **Users can update own reactions**
- Applied to: public role

## Структура полей реакций

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | uuid | Уникальный идентификатор | Primary Key, auto-generated |
| `review_id` | uuid | ID отзыва | Foreign Key → product_reviews(id), CASCADE |
| `user_id` | uuid | ID пользователя | Foreign Key → profiles(id), CASCADE |
| `reaction_type` | text | Тип реакции | 'like' или 'dislike' |
| `created_at` | timestamp | Дата создания | auto now() |

## Особенности реакций

- **Уникальные реакции** - один пользователь может поставить только одну реакцию на отзыв
- **Типы реакций** - только лайк или дизлайк
- **Автоматические счетчики** - триггер обновляет total_likes/total_dislikes в product_reviews
- **CASCADE удаление** при удалении отзыва или пользователя
- **RLS политики** - пользователи могут управлять только своими реакциями
- **Оптимизация** - индексы для быстрых запросов по review_id и user_id

## Функция update_review_reaction_counts

Эта функция автоматически обновляет счетчики `total_likes` и `total_dislikes` в таблице `product_reviews` при изменении реакций.

## Полная архитектура системы отзывов

Теперь у нас есть **4 взаимосвязанные таблицы**:

1. **`product_reviews`** - основные отзывы с рейтингом и текстом
2. **`review_comments`** - комментарии с иерархической структурой  
3. **`review_media`** - изображения и видео для отзывов
4. **`review_reactions`** - лайки/дизлайки с автоматическими счетчиками

Все таблицы связаны через `review_id` с CASCADE удалением для целостности данных.