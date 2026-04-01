# Module Mapping: Plant Tracker

## Analysis Summary

"Plant" is the core entity. Watering and health tracking are distinct bounded contexts — watering is action-oriented (mutations, schedules), health tracking is observation-oriented (logs, trends). Both share the Plant entity but have different lifecycles.

## Mapping

| Feature          | Target               | Rationale                                                      |
| ---------------- | -------------------- | -------------------------------------------------------------- |
| Plant CRUD       | plants/plant-list    | Language + routes — core entity management                     |
| Watering actions | plants/watering      | Change coupling — watering mutations are independent of CRUD   |
| Health tracking  | plants/health        | Lifecycle cohesion — observation data has its own update cycle |
| Plant images     | @packages/core-media | Stability boundary — shared image handling across modules      |
