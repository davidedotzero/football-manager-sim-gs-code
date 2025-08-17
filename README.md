# American Football Management Simulation Game on Google Sheets

## 1. Project Overview

This project is a text-based American Football Management Simulation Game built entirely within the Google Sheets and Google Apps Script ecosystem. It aims to create a deep, scalable, and engaging simulation experience where users can manage their team, set lineups, and watch games unfold based on player attributes and strategic decisions.

---

## 2. Architecture & Design Principles

The project adheres to modern software development practices, emphasizing scalability, maintainability, and clean code.

- **Separation of Concerns:** The business logic (game simulation) is strictly separated from the data layer (Google Sheets) and the presentation layer.
- **Service-Oriented Architecture:** Logic is encapsulated in dedicated services (e.g., `GameLogicService`, `GameStateService`) to ensure modularity.
- **Configuration-driven:** All static values, sheet names, and ranges are managed in a central `Config.gs` file to avoid hardcoding.

---

## 3. Project Structure

The project is organized into two main components: The **Data Layer** (Google Sheets) and the **Application Layer** (Google Apps Script).

### 3.1. Data Layer (Google Sheets)

The Google Sheet acts as our database. Each sheet represents a table or a specific data model.

- **`teams`**: Stores information about each team (e.g., `team_id`, `city`, `team_name`).
- **`players`**: The master list of all players in the game, including their attributes, stats, and contract details.
- **`active_lineup`**: Defines the starting offensive and defensive lineups for a given game.
- **`game_state`**: A dynamic sheet that represents the live state of a single game, including the score, down, distance, ball position, and play-by-play log.
- **`play_sim`**: An interface sheet used to trigger a single play simulation. It takes inputs like play calls and current game state to produce an outcome.
- **`penalty_table`**: A configuration table that defines all possible penalties, their yardage, and their effects.

### 3.2. Application Layer (Google Apps Script)

All game logic is written in Google Apps Script (`.gs` files).

- **`/Config.gs`**:
  - **Purpose:** Centralized configuration.
  - **Details:** Contains all constants, sheet names, cell ranges, and environment settings. Prevents hardcoding.

- **`/controllers/`**:
  - **`GameController.gs`**: Handles high-level game flow orchestration (e.g., starting a game, processing a quarter, ending a game).
  - **`SetupController.gs`**: Manages the initial setup of the game sheets and environment.
  - **`RosterController.gs`**: Manages roster data manipulation and validation.

- **`/services/`**:
  - **`GameLogicService.gs`**: The core of the simulation engine. Contains the business logic for executing a single play, calculating outcomes based on player ratings, play calls, and chance.
  - **`GameStateService.gs`**: A dedicated service for reading from and writing to the `game_state` sheet. It acts as an abstraction layer, so other services don't need to know the specific cell ranges.
  - **`AIService.gs`**: Contains logic for AI-driven decision-making, such as play calling for non-player characters (NPCs).

- **`/utils/`**:
  - **`Utils.gs`**: A collection of utility and helper functions used across the project (e.g., random number generators, data formatting functions).

---

## 4. Naming Conventions

- **Classes/Models:** `PascalCase` (Singular) - e.g., `Player`, `Team`
- **Functions/Methods:** `camelCase` - e.g., `simulatePlay`, `getGameState`
- **Database Tables (Sheets):** `snake_case` (Plural, if applicable) - e.g., `game_state`, `players`

---

# เกมจำลองการจัดการทีมอเมริกันฟุตบอลบน Google Sheets

## 1. ภาพรวมโปรเจกต์

โปรเจกต์นี้คือเกมจำลองการจัดการทีมอเมริกันฟุตบอลแบบข้อความ (Text-based) ที่สร้างขึ้นบนระบบนิเวศของ Google Sheets และ Google Apps Script ทั้งหมด โดยมีเป้าหมายเพื่อสร้างประสบการณ์การจำลองเกมที่ลึกซึ้ง, ขยายผลได้ และน่าติดตาม ซึ่งผู้ใช้สามารถจัดการทีม, จัดผู้เล่นตัวจริง และชมเกมที่ดำเนินไปตามคุณสมบัติของผู้เล่นและการตัดสินใจเชิงกลยุทธ์

---

## 2. สถาปัตยกรรมและหลักการออกแบบ

โปรเจกต์นี้ยึดตามแนวทางการพัฒนาซอฟต์แวร์สมัยใหม่ โดยเน้นที่ความสามารถในการขยายผล (Scalability), การบำรุงรักษา (Maintainability) และโค้ดที่สะอาด (Clean Code)

- **การแบ่งแยกหน้าที่ (Separation of Concerns):** ตรรกะทางธุรกิจ (การจำลองเกม) ถูกแยกออกจากเลเยอร์ข้อมูล (Google Sheets) และเลเยอร์การแสดงผลอย่างเคร่งครัด
- **สถาปัตยกรรมแบบเน้นบริการ (Service-Oriented Architecture):** ตรรกะของเกมถูกห่อหุ้มไว้ในบริการ (Services) ที่มีหน้าที่เฉพาะเจาะจง (เช่น `GameLogicService`, `GameStateService`) เพื่อให้ง่ายต่อการแก้ไขและแยกส่วนการทำงาน
- **ขับเคลื่อนด้วยไฟล์กำหนดค่า (Configuration-driven):** ค่าคงที่, ชื่อชีต และช่วงเซลล์ทั้งหมดจะถูกจัดการในไฟล์ส่วนกลาง `Config.gs` เพื่อหลีกเลี่ยงการ Hardcode

---

## 3. โครงสร้างโปรเจกต์

โปรเจกต์ถูกแบ่งออกเป็นสององค์ประกอบหลัก: **เลเยอร์ข้อมูล (Data Layer)** ซึ่งคือ Google Sheets และ **เลเยอร์แอปพลิเคชัน (Application Layer)** ซึ่งคือ Google Apps Script

### 3.1. เลเยอร์ข้อมูล (Data Layer - Google Sheets)

Google Sheet ทำหน้าที่เป็นฐานข้อมูลของเรา โดยแต่ละชีตจะแทนตารางหรือโมเดลข้อมูลที่เฉพาะเจาะจง

- **`teams`**: เก็บข้อมูลเกี่ยวกับแต่ละทีม (เช่น `team_id`, `city`, `team_name`)
- **`players`**: รายชื่อผู้เล่นทั้งหมดในเกม รวมถึงค่าพลัง, สถิติ และรายละเอียดสัญญา
- **`active_lineup`**: กำหนดรายชื่อผู้เล่นตัวจริงทั้งทีมรุกและทีมรับสำหรับเกมนั้นๆ
- **`game_state`**: ชีตแบบไดนามิกที่แสดงสถานะล่าสุดของเกม เช่น คะแนน, ดาวน์, ระยะ, ตำแหน่งลูก และบันทึกการเล่น (Play-by-play)
- **`play_sim`**: ชีตที่เป็น Interface สำหรับสั่งให้จำลองการเล่น (Play) แต่ละครั้ง โดยจะรับข้อมูล เช่น แผนการเล่น และสถานะปัจจุบันของเกม เพื่อสร้างผลลัพธ์
- **`penalty_table`**: ตารางการตั้งค่าที่กำหนดบทลงโทษที่เป็นไปได้ทั้งหมด, ระยะที่เสีย และผลกระทบของการฟาวล์

### 3.2. เลเยอร์แอปพลิเคชัน (Application Layer - Google Apps Script)

ตรรกะทั้งหมดของเกมถูกเขียนด้วย Google Apps Script (ไฟล์ `.gs`)

- **`/Config.gs`**:
  - **วัตถุประสงค์:** การกำหนดค่าส่วนกลาง
  - **รายละเอียด:** ประกอบด้วยค่าคงที่, ชื่อชีต, ช่วงเซลล์ และการตั้งค่าสภาพแวดล้อมทั้งหมด เพื่อป้องกันการ Hardcode

- **`/controllers/`**:
  - **`GameController.gs`**: จัดการการดำเนินเกมในระดับสูง (เช่น เริ่มเกม, ดำเนินการในแต่ละควอเตอร์, จบเกม)
  - **`SetupController.gs`**: จัดการการตั้งค่าเริ่มต้นของชีตเกมและสภาพแวดล้อม
  - **`RosterController.gs`**: จัดการการเปลี่ยนแปลงและตรวจสอบความถูกต้องของข้อมูลผู้เล่น

- **`/services/`**:
  - **`GameLogicService.gs`**: หัวใจหลักของเอนจิ้นจำลองเกม ประกอบด้วยตรรกะทางธุรกิจสำหรับการดำเนิน "Play" หนึ่งครั้ง, คำนวณผลลัพธ์จากค่าพลังผู้เล่น, แผนการเล่น และองค์ประกอบของโอกาส
  - **`GameStateService.gs`**: บริการเฉพาะสำหรับการอ่านและเขียนข้อมูลไปยังชีต `game_state` ทำหน้าที่เป็นเลเยอร์กลาง เพื่อให้ Service อื่นๆ ไม่จำเป็นต้องรู้ช่วงเซลล์ที่เฉพาะเจาะจง
  - **`AIService.gs`**: ประกอบด้วยตรรกะสำหรับการตัดสินใจที่ขับเคลื่อนด้วย AI เช่น การเลือกแผนการเล่นสำหรับทีมที่ไม่ใช่ผู้เล่น (NPC)

- **`/utils/`**:
  - **`Utils.gs`**: ชุดของฟังก์ชันช่วยเหลือที่ใช้ทั่วทั้งโปรเจกต์ (เช่น การสุ่มตัวเลข, ฟังก์ชันจัดรูปแบบข้อมูล)

---

## 4. มาตรฐานการตั้งชื่อ (Naming Conventions)

- **Classes/Models:** `PascalCase` (Singular) - เช่น `Player`, `Team`
- **Functions/Methods:** `camelCase` - เช่น `simulatePlay`, `getGameState`
- **Database Tables (Sheets):** `snake_case` (Plural, ถ้าเหมาะสม) - เช่น `game_state`, `players`