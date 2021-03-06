import { Injectable } from '@angular/core';
import { SaveUpdateClass } from './update/save-update-class';
import * as Constants from '../globals/Constants';
import { ScrollDataGroup } from '../globals/interfaces';

@Injectable({
  providedIn: 'root'
})
export class MonthlyService {

  public montlyData;
  public total = 0;
  private saveName = 'IHM_Monthly';

  public montlyDataOrbs;
  public totalOrbs = 0;
  private saveNameOrbs = 'IHM_Monthly_Orbs';

  public montlyDataArenaTokens;
  public totalArenaTokens = 0;
  private saveNameArenaTokens = 'IHM_Monthly_ArenaTokens';

  private handlesWithDynamicIncome = new Set();

  private updateSave = new SaveUpdateClass();


  // Aspen Data
  private saveNameAspen = 'IHM_ASPEN_DUNGEON';
  public floorsCompleted = 0;
  public baronessScrolls = 0;
  public oldLadyScrolls = 0;
  public totalScrollsAspen = 0;
  public baronessOrbs = 0;
  public oldLadyOrbs = 0;
  public totalOrbsAspen = 0;


  constructor() {
    this.load();
  }

  public changeMonthlyData(data) {
    const handle = data.handle;
    const scrolls = data.scrolls;
    const orbs = data.orbs;
    const arenaTokens = data.arenaTokens;
    if (scrolls !== undefined) {
      this.montlyData[handle] = scrolls;
    }
    if (orbs !== undefined) {
      this.montlyDataOrbs[handle] = orbs;
    }
    if (arenaTokens !== undefined) {
      this.montlyDataArenaTokens[handle] = arenaTokens;
    }
    this.calculateAll();
    this.save();
  }

  public removeMonthlyData(data) {
    const handle = data.handle;
    delete this.montlyData[handle];
    delete this.montlyDataOrbs[handle];
    delete this.montlyDataArenaTokens[handle];
    this.calculateAll();
    this.save();
  }

  public getIfSelected(handle) {
    return this.montlyData[handle] !== undefined
      || this.montlyDataOrbs[handle] !== undefined
      || this.montlyDataArenaTokens[handle] !== undefined;
  }

  public calculateAll() {
    this.calculateAspenData();
    this.calculateTotalArenaTokens();
    this.calculateTotalScrolls();
    this.calculateTotalOrbs();
  }

  public calculateTotalScrolls() {
    this.total = 0;
    Object.entries(this.montlyData).forEach((data: any) => {
      const handle = data[0];
      const amount = Number(data[1]);
      if (amount !== undefined) {
        this.total += amount;
      }


      if (this.handlesWithDynamicIncome.has(handle)) {
        this.total -= amount;
        if (handle === 'fromAspenDungeonWhenMediorHasScroll') {
          this.total += this.baronessScrolls;
        }
        if (handle === 'fromAspenDungeonWhenSeniorHasScroll') {
          this.total += this.oldLadyScrolls;
        }
      }
    });
  }

  public calculateTotalArenaTokens() {
    this.totalArenaTokens = 0;
    Object.entries(this.montlyDataArenaTokens).forEach((data: any) => {
      const handle = data[0];
      const amount = Number(data[1]);
      if (amount !== undefined) {
        this.totalArenaTokens += amount;
      }
    });
  }

  public calculateTotalOrbs() {
    // aspenDungeonBaroness-Orb
    this.totalOrbs = 0;
    // Object.values(this.montlyDataOrbs).forEach((amount: number) => {
    //   this.totalOrbs += amount;
    // });
    Object.entries(this.montlyDataOrbs).forEach((data: any) => {
      const handle = data[0];
      const amount = Number(data[1]);
      this.totalOrbs += amount;

      if (this.handlesWithDynamicIncome.has(handle)) {
        this.totalOrbs -= amount;
        if (handle === 'aspenDungeonBaroness-Orb') {
          this.totalOrbs += this.baronessOrbs;
        }
        if (handle === 'aspenDungeonOldLady-Orb') {
          this.totalOrbs += this.oldLadyOrbs;
        }
        if (handle === 'orbsFromArenaTokensYes-Orb') {
          this.totalOrbs += this.calcOrbsFromArenaTokens();
        }
      }
    });
  }

  private calcOrbsFromArenaTokens() {
    return Math.floor(this.totalArenaTokens / 200);
  }

  public calculateAspenData() {
    const aspenDungeonsPerMonth = 365.25 / 12 / 4;
    const baronessScrollEncounterPercentage = 0.0615; // 6.15% for 5 scrolls
    const oldLadyScrollEncounterPercentage = 0.0231; // 2.31% for 10 scrolls

    const baronessOrbEncounterPercentage = 0.0321; // 3.21% for 1 orb
    const oldLadyOrbEncounterPercentage = 0.0077; // 0.77% for 5 orbs
    let merchantsEncountered = 0;


    if (this.floorsCompleted <= 300) {
      merchantsEncountered += (this.floorsCompleted * .15);
    } else {
      merchantsEncountered += (300 * .15);
      merchantsEncountered += ((this.floorsCompleted - 300) * .1);
    }

    this.baronessScrolls = (merchantsEncountered * baronessScrollEncounterPercentage) * 5 * aspenDungeonsPerMonth;
    this.oldLadyScrolls = (merchantsEncountered * oldLadyScrollEncounterPercentage) * 10 * aspenDungeonsPerMonth;
    this.totalScrollsAspen = Math.floor(this.baronessScrolls + this.oldLadyScrolls);
    this.baronessScrolls = Math.floor(this.baronessScrolls);
    this.oldLadyScrolls = Math.floor(this.oldLadyScrolls);

    this.baronessOrbs = (merchantsEncountered * baronessOrbEncounterPercentage) * aspenDungeonsPerMonth;
    this.oldLadyOrbs = (merchantsEncountered * oldLadyOrbEncounterPercentage) * 5 * aspenDungeonsPerMonth;
    this.totalOrbsAspen = Math.floor(this.baronessOrbs + this.oldLadyOrbs);
    this.baronessOrbs = Math.floor(this.baronessOrbs);
    this.oldLadyOrbs = Math.floor(this.oldLadyOrbs);
  }

  public setAspenDungeonFloor(floor) {
    this.floorsCompleted = floor;
    this.save();
    this.calculateAll();
  }

  public save() {
    localStorage.setItem(this.saveName, JSON.stringify(this.montlyData));
    localStorage.setItem(this.saveNameOrbs, JSON.stringify(this.montlyDataOrbs));
    localStorage.setItem(this.saveNameArenaTokens, JSON.stringify(this.montlyDataArenaTokens));
    localStorage.setItem(this.saveNameAspen, JSON.stringify(this.floorsCompleted));
  }

  private generateDynalicValueSet() {
    const dataGroup = Constants.MONTHLY_SCROLLS_DATA;
    const dataGroupOrbs = Constants.MONTHLY_ORBS_DATA;
    Object.values(dataGroup).forEach((groupData: ScrollDataGroup) => {
      groupData.subdata.forEach((data) => {
        if (data.hasOwnProperty('dynamicIncome') && data.dynamicIncome) {
          this.handlesWithDynamicIncome.add(data.handle);
        }
      });
    });
    Object.values(dataGroupOrbs).forEach((groupData: ScrollDataGroup) => {
      groupData.subdata.forEach((data) => {
        if (data.hasOwnProperty('dynamicIncome') && data.dynamicIncome) {
          this.handlesWithDynamicIncome.add(data.handle);
        }
      });
    });
  }

  public load() {
    this.generateDynalicValueSet();

    const saveDataAspen = JSON.parse(localStorage.getItem(this.saveNameAspen));
    if (saveDataAspen) {
      this.floorsCompleted = Number(saveDataAspen);
    }

    this.montlyData = JSON.parse(localStorage.getItem(this.saveName));
    if (!this.montlyData) {
      this.montlyData = {};
    }
    this.montlyData = this.updateSave.updateScrollSaveData(this.montlyData);

    this.montlyDataOrbs = JSON.parse(localStorage.getItem(this.saveNameOrbs));
    if (!this.montlyDataOrbs) {
      this.montlyDataOrbs = {};
    }
    this.montlyDataOrbs = this.updateSave.updateOrbSaveData(this.montlyDataOrbs);


    this.montlyDataArenaTokens = JSON.parse(localStorage.getItem(this.saveNameArenaTokens));
    if (!this.montlyDataArenaTokens) {
      this.montlyDataArenaTokens = {};
    }
    this.montlyDataArenaTokens = this.updateSave.updateArenaTokenSaveData(this.montlyDataArenaTokens);

    this.calculateAll();
  }
}
