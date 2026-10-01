# 《VMS》D1 数据库版本化 SQL 迁移目录 (vms-blog/sql)

本目录用于统一归档和管理 Cloudflare D1 (SQLite) 数据库的初始化与版本迭代 SQL 脚本。

---

## 命名规范 (Naming Convention)

所有 SQL 文件采用 **语义化版本号 + 14位时间戳 (YYYYMMDDHHMMSS) + 业务功能描述** 的命名规则：

```text
v<主版本>.<次版本>.<修订号>_<年月日时分秒>_<业务功能描述>.sql
```

每个里程碑大版本确立一个基准基线（Baseline），后续功能增改按时间戳追加增量补丁（Incremental Patch）。

---

## 迁移文件清单 (Migrations)

| 版本与时间戳 | 文件名 | 涉及表与模型设计 | 说明 |
| :--- | :--- | :--- | :--- |
| **v1.0.0** (Baseline)<br>`20260928213000` | [v1.0.0_20260928213000_init_all_tables.sql](./v1.0.0_20260928213000_init_all_tables.sql) | • `users` (含 `bio` 个人独白、`avatar_url`、`role`)<br>• `verification_codes` (5分钟失效+3次防爆破)<br>• `albums` (关联 `author_id` 外键)<br>• `articles` (关联 `author_id` 外键，七维体系与日历索引)<br>• `annotations` (对开翻书批注流，含 `is_pinned`)<br>• `annotation_likes` (原子防重刷赞表)<br>• `bookmarks` (含 `last_page_index` 翻书记忆书签) | **《VMS》全栈数字花园完整数据基线**。<br>一步到位完成全系统 7 张数据表初始化，避免多文件重叠声明与依赖冲突。 |
| **v1.1.0** (Seed Data)<br>`20261001083000` | [v1.1.0_20261001083000_seed_initial_data.sql](./v1.1.0_20261001083000_seed_initial_data.sql) | • `users` (博主白心解资料)<br>• `albums` (7大精品专栏专辑)<br>• `articles` (涵盖七维认知的18篇经典博文) | **《VMS》阶段三测试与基线种子数据**。<br>包含博主资料、7大专栏专辑与18篇七维经典博文，供首页三栏工作台与翻书慢读开箱即用。 |
| **v1.2.0** (Auth Update)<br>`20261002073000` | [v1.2.0_20261002073000_add_password_and_activation.sql](./v1.2.0_20261002073000_add_password_and_activation.sql) | • `users` (扩展 `password_hash`, `is_active`)<br>• `activation_tokens` (邮箱激活令牌关联表) | **《VMS》邮箱激活与密码登录架构升级**。<br>支持用户邮箱注册、激活邮件投递、邮箱激活与账号密码安全登录。 |

---

## D1 命令行执行指引 (Wrangler CLI)

在 `vms-blog` 目录下执行以下命令：

### 1. 应用到本地开发数据库 (用于本地开发与脱机调试)
```bash
npx wrangler d1 execute vms-db --local --file=./sql/v1.0.0_20260928213000_init_all_tables.sql
```

### 2. 应用到 Cloudflare 远端生产数据库
```bash
npx wrangler d1 execute vms-db --remote --file=./sql/v1.0.0_20260928213000_init_all_tables.sql
```

### 3. 查看与校验数据表
```bash
# 查看本地数据库所有数据表 (预期输出 7 张业务表)
npx wrangler d1 execute vms-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"

# 校验文章与作者关联关系
npx wrangler d1 execute vms-db --local --command="SELECT a.title, u.nickname FROM articles a JOIN users u ON a.author_id = u.id LIMIT 5;"
```
